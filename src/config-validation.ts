import url from "url";
import { AuthenticationProviderFactory } from "./authentication/provider";
import { Configuration, ConfigurationAudit } from "./config";
import { encode as toBase64 } from "./base64";
import createSelfSignedCertificate from "./cert";
import { pki } from "node-forge";

/**
 * Validates and sanitizes the application configuration.
 * @param config The configuration object to validate.
 * @returns An object containing configuration errors and warnings found during the validation process.
 */
export default async function validate(config: Configuration) : Promise<ConfigurationAudit> {
    let result = {
        errors: [],
        warnings: []
    } as ConfigurationAudit;

    const isDevel = (process.env.NODE_ENV = process.env.NODE_ENV || "production") === "development";

    if (!(config.api.server && config.api.token))
        result.errors.push("Are you running the app outside Kubernetes? Additional steps are required...");

    if (!config.api.server)
        result.errors.push(
            "API server address not set. " + (isDevel ?
                "Manually configure the address in development.config.json." :
                "Provide environment variables KUBERNETES_SERVICE_HOST and KUBERNETES_PORT_443_TCP_PORT to the app."
            )
        );

    if (!config.api.token)
        result.errors.push(
            "Service account token not present. " + (isDevel ?
                "Manually configure the token in development.config.json. Execute \"kubectl -n kube-system describe secret $(kubectl -n kube-system get secret | grep <your-service-account> | awk '{print $1}')\" to retrieve a token." :
                "Provide an access token under /run/secrets/kubernetes.io/serviceaccount/token with scope serviceaccounts:list+read and secrets:read. See deployment.yaml."
            )
        );

    if (!config.tls.cert || !config.tls.key) {
        let selfSignedCert = createSelfSignedCertificate();
        config.tls.cert = toBase64(selfSignedCert.cert)!;
        config.tls.key = toBase64(selfSignedCert.key)!;
        result.warnings.push("Generated a self signed certificate.");
    } else {
        try {
            pki.certificateFromPem(config.tls.cert);
            pki.privateKeyFromPem(config.tls.key);
        } catch {
            result.errors.push("Invalid certificate and/or private key.")
        }
    }

    !config.auth.provider && result.errors.push("No authentication provider specified.")
    if (!(config.auth.acl.fallback || Object.keys(config.auth.acl.users).length || Object.keys(config.auth.acl.groups).length)) {
        config.auth.acl.fallback = "kube-system/kubernetes-dashboard";
        result.warnings.push(`The access control list was empty. Fallback is now ${config.auth.acl.fallback}.`);
    }
    
    try {
        let upstream = url.parse(config.upstream);
        if (upstream.protocol !== "https:") {
            upstream.protocol = "https:";
            result.warnings.push("Dashboard address was http. Using https instead.");
        }
        config.upstream = url.format(upstream);
    } catch {
        result.errors.push("Invalid dashboard address.")
    }
    
    if (config.auth.provider) {
        let provider = await AuthenticationProviderFactory.getProvider(config.auth.provider);
        if (!provider)
            result.errors.push(`Unknown authentication provider: ${config.auth.provider}.`);
        else {
            let result = provider.validateConfiguration();
            for (let error of result.errors)
                result.errors.push(error);
            for (let warning of result.warnings)
                result.warnings.push(warning);
        }
    }

    return result;
}
