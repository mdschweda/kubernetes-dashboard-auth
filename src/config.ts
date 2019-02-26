import fs from "fs";
import path from "path";
import { decode } from "./base64";
import { merge } from "lodash";
import validate from "./validation";

// Development configuration (development.config.json)
function devel() {
    if ((process.env.NODE_ENV = process.env.NODE_ENV || "production") !== "development")
        return { };

    let dir = __dirname;
    
    try {
        while (fs.existsSync(dir)) {
            if (fs.existsSync(path.join(dir, "development.config.json"))) {
                let json = fs.readFileSync(path.join(dir, "development.config.json")).toString();
                return JSON.parse(json);
            }

            let parent = path.resolve(path.join(dir, ".."));
            if (parent === dir)
                break;

            dir = parent;
        }
    } catch { }
}

/**
 * The application configuration.
 */
export interface Configuration {
    /** The url of the dashboard. Default is `https://kubernetes-dashboard.kube-system.svc.cluster.local:8443/`. */
    upstream: string;
    /** The SSL configuration. */
    tls: {
        /** The server certificate. */
        cert: string;
        /** The private key of the server. */
        key: string;
    },
    host: {
        /** The server ports. */
        port: {
            /** The HTTP port. Default is `80`. */
            http: number;
            /** The HTTPS port. Default is `443`. */
            https: number;
        }
    },
    /** The authentication and authorization configuration. */
    auth: {
        /** The used authentication provider. */
        provider: string;
        // TODO acr: "serviceAccount" or acr: { "$default": "serviceAccount1", "user1": "serviceAccount2", "user2": "serviceAccount3" }
        token: string;
        /** Configuration used in conunction with provider `ldap`. */
        ldap: {
            /** The LDAP server address. */
            server: string;
            /** The distinguished name of the account to use when connecting to the LDAP server. */
            bindUser: string;
            /** The password to use when connecting to the LDAP server. */
            bindPassword: string;
            /** The distinguished name of the entity where to search in. */
            baseDN: string;
            /** The name of the LDAP attribute that holds the account name. Default is `sAMAccountName`. */
            userAttribute: string;
            /** When set, the user must be member of this group to access the dashboard. */
            group: string | undefined;
        },
        github: {
            /** The name of the GitHub organization as displayed in the URL of the organization page: `github.com/orgs/{{organization}}` */
            organization: string;
            /** When set, the user must be member of this team to access the dashboard. */
            team: string | undefined;
        }
    }
}

const defaults = {
    upstream: "https://kubernetes-dashboard.kube-system.svc.cluster.local:8443/",
    host: {
        port: {
            http: 80,
            https: 443
        }
    },
    auth: {
        acr: {
            "$default": "dashboard"
        },
        ldap: {
            userAttribute: "sAMAccountName"
        }
    }
};

const providedValues = {
    upstream: process.env.CONFIG_UPSTREAM,
    tls: {
        cert: process.env.CONFIG_TLS_CERT && decode(process.env.CONFIG_TLS_CERT),
        key: process.env.CONFIG_TLS_KEY && decode(process.env.CONFIG_TLS_KEY)
    },
    host: {
        port: {
            http: process.env.CONFIG_HOST_PORT_HTTP && Number.parseInt(process.env.CONFIG_HOST_PORT_HTTP),
            https: process.env.CONFIG_HOST_PORT_HTTPS && Number.parseInt(process.env.CONFIG_HOST_PORT_HTTPS)
        }
    },
    auth: {
        provider: process.env.CONFIG_AUTH_PROVIDER,
        token: process.env.CONFIG_AUTH_TOKEN,
        ldap: {
            server: process.env.CONFIG_AUTH_LDAP_SERVER,
            bindUser: process.env.CONFIG_AUTH_LDAP_BIND_USER,
            bindPassword: process.env.CONFIG_AUTH_LDAP_BIND_PASSWORD,
            baseDN: process.env.CONFIG_AUTH_LDAP_BASE_DN,
            userAttribute: process.env.CONFIG_AUTH_LDAP_USER_ATTRIBUTE,
            group: process.env.CONFIG_AUTH_LDAP_USER_GROUP,
        },
        github: {
            organization: process.env.CONFIG_AUTH_GITHUB_ORGANIZATION,
            team: process.env.CONFIG_AUTH_GITHUB_TEAM
        }
    }
};

const config = merge(merge(defaults, devel()), providedValues) as Configuration;

validate(config).then(errors => {
    if (errors.length) {
        console.error("⛔ Please, revise your configuration:")
    
        for (let e of errors)
            console.error(`- ${e}`);
    
        console.error("See https://github.com/mdschweda/kubernetes-dashboard-auth for details.");
        process.exit(1);
    }
});

export default config;
