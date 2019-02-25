import fs from "fs";
import path from "path";
import url from "url";
import { decode } from "./base64";
import { AuthenticationProviderFactory } from "./authentication/provider";

process.env.NODE_ENV = process.env.NODE_ENV || "production";

// Development mode
if (process.env.NODE_ENV === "development") {
    let dir = __dirname;
    
    try {
        while (fs.existsSync(dir)) {
            if (fs.existsSync(path.join(dir, "development.env.json"))) {
                let json = fs.readFileSync(path.join(dir, "development.env.json")).toString();
                let develConfig = JSON.parse(json);
                for (var c in develConfig)
                    process.env[c] = develConfig[c] || process.env[c]
            }

            let parent = path.resolve(path.join(dir, ".."));
            if (parent === dir)
                break;

            dir = parent;
        }
    } catch { }
}

let config = {
    upstream: process.env.PROXY_UPSTREAM || "https://kubernetes-dashboard.kube-system.svc.cluster.local:8443/",
    tls: {
        crt: decode(process.env.PROXY_CERT || ""),
        key: decode(process.env.PROXY_KEY || "")
    },
    host: {
        port: {
            http: Number.parseInt(process.env.PROXY_PORT || "80"),
            https: Number.parseInt(process.env.PROXY_PORT_SSL || "443")
        }
    },
    authentication: {
        provider: process.env.AUTH_PROVIDER || "",
        token: process.env.AUTH_TOKEN || "",
        ldap: {
            server: process.env.LDAP_SERVER || "",
            bindUser: process.env.LDAP_BIND_USER || "",
            bindPassword: process.env.LDAP_BIND_PASSWORD || "",
            baseDN: process.env.LDAP_BASE_DN || "",
            userAttribute: process.env.LDAP_USER_ATTRIBUTE || "sAMAccountName",
            group: process.env.LDAP_USER_GROUP,
        },
        github: {
            organization: process.env.GITHUB_ORGANIZATION
        }
    }
};

// #region Validation + Sanitization

(async () => {
    let errors = [];
    !(config.tls.crt && config.tls.key) && errors.push("Certificate improperly configured.");
    !config.authentication.token && errors.push("No bearer token configured.");
    !config.authentication.provider && errors.push("No authentication provider specified.")
    
    try {
        let upstream = url.parse(config.upstream);
        if (upstream.protocol !== "https:")
            upstream.protocol = "https:";
        config.upstream = url.format(upstream);
    } catch {
        errors.push("Invalid dashboard address (option 'upstream').")
    }
    
    if (config.authentication.provider) {
        let provider = await AuthenticationProviderFactory.getProvider(config.authentication.provider);
        if (!provider)
            errors.push(`Unknown authentication provider: ${config.authentication.provider}.`);
        else
            for (var error of provider.configurationErrors)
                errors.push(error);
    }
    
    if (errors.length) {
        console.error("⛔ Please, revise your configuration:")
    
        for (let e of errors)
            console.error(`- ${e}`);
    
        console.error("See https://github.com/mdschweda/kubernetes-dashboard-auth for details.");
        process.exit(1);
    }
    
    if (process.env.NODE_ENV !== "production")
        console.warn(`Environment is ${process.env.NODE_ENV}`);
})();

// #endregion

export default config;
