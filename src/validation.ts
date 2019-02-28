import url from "url";
import { AuthenticationProviderFactory } from "./authentication/provider";
import { Configuration } from "./config";

/**
 * Validates and sanitizes the application configuration.
 * @param config The configuration object to validate.
 * @returns An array of configuration errors found during the validation process.
 */
export default async function validate(config: Configuration) : Promise<string[]> {
    let errors = [];

    const isDevel = (process.env.NODE_ENV = process.env.NODE_ENV || "production") === "development";

    if (!config.api.server)
        errors.push(
            "Kubernetes API server address not set. " + (isDevel ?
                "Manually configure the address in development.config.json." :
                "Manually provide environment variables KUBERNETES_SERVICE_HOST and KUBERNETES_PORT_443_TCP_PORT for the deployment."
            )
        );

    if (!config.api.token)
        errors.push(
            "Kubernetes service account token not set. " + (isDevel ?
                "Manually configure the token in development.config.json. Execute \"kubectl -n kube-system describe secret $(kubectl -n kube-system get secret | grep <your-service-account> | awk '{print $1}')\" to retrieve a token." :
                "Make sure the service account dashboard-auth-proxy is present or redeploy the application to your cluster."
            )
        );

    !(config.tls.cert && config.tls.key) && errors.push("Certificate improperly configured.");
    !config.auth.provider && errors.push("No authentication provider specified.")
    if (typeof config.auth.acl === "string")
        !config.auth.acl && errors.push("No default service account specified.");
    else if (typeof config.auth.acl === "object")
        !(config.auth.acl.fallback || config.auth.acl.users || config.auth.acl.groups) && errors.push("The access control list is empty.");
    
    try {
        let upstream = url.parse(config.upstream);
        if (upstream.protocol !== "https:")
            upstream.protocol = "https:";
        config.upstream = url.format(upstream);
    } catch {
        errors.push("Invalid dashboard address (option 'upstream').")
    }
    
    if (config.auth.provider) {
        let provider = await AuthenticationProviderFactory.getProvider(config.auth.provider);
        if (!provider)
            errors.push(`Unknown authentication provider: ${config.auth.provider}.`);
        else
            for (var error of provider.configurationErrors)
                errors.push(error);
    }

    return errors;
}
