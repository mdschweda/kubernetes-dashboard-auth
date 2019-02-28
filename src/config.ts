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

// Get service account token from auto-mounted Kubernetes secret
function tokenFromAutomount() {
    let root = path.parse(__dirname).root;
    let secret = path.join(root, "run", "secrets", "kubernetes.io", "serviceaccount", "token");
    if (fs.existsSync(secret) && fs.lstatSync(secret).isFile())
        return fs.readFileSync(secret).toString();
}

// Get api server address from Kubernetes environment variables
function apiServerAddress() {
    if (process.env.KUBERNETES_SERVICE_HOST && process.env.KUBERNETES_PORT_443_TCP_PORT)
        return `https://${process.env.KUBERNETES_SERVICE_HOST}:${process.env.KUBERNETES_PORT_443_TCP_PORT}/api/v1/`;
}

function tryDeserialize(content: string | undefined) {
    if (content) {
        try {
            return JSON.parse(content)
        } catch { }
    }
}

/**
 * The application configuration.
 */
export interface Configuration {
    /** The url of the dashboard (from within the cluster). Default is `https://kubernetes-dashboard.kube-system.svc.cluster.local:8443/`. */
    upstream: string;
    /** API server information */
    api: {
        readonly server: string;
        readonly token: string;
    },
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
        /** The ACL (access control list) that maps users to Kubernetes service accounts. Default is `kube-system/dashboard-admin`. */
        acl: {
            /** The service account used when no entry in `users` or `groups` matches the authenticated user. Default is `kube-system/dashboard-admin`. Unset this value to whitelist authorized users. */
            fallback: string | undefined,
            /** Key-value-pairs mapping user names to Kubernetes service accounts. */
            users: {
                [name: string]: string
            } | undefined,
            /** Key-value-pairs mapping user group names to Kubernetes service accounts. The `auth.provider` implementations define what is considered a group. */
            groups: {
                [name: string]: string
            } | undefined
        } | string,
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
        },
        github: {
            /** The name of the GitHub organization as displayed in the URL of the organization page: `github.com/orgs/{{organization}}` */
            organization: string;
        },
        azuread: {
            /** The id of the Azure AD tenant as displayed in the "Properties" blade ("Directory ID") */
            tenant: string,
            /** Required information of the registered AZure AD app. */
            client: {
                /** The application ID as displayed in the "Overview" blade of the app. */
                id: string,
                /** The client secret value as displayed in the "Certificates & secrets" blade of the app. */
                secret: string
            }
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
        acl: "dashboard-admin",
        ldap: {
            userAttribute: "sAMAccountName"
        }
    }
};

const providedValues = {
    upstream: process.env.CONFIG_UPSTREAM,
    api: {
        server: apiServerAddress(),
        token: tokenFromAutomount()
    },
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
        acl: tryDeserialize(process.env.CONFIG_AUTH_ACL),
        ldap: {
            server: process.env.CONFIG_AUTH_LDAP_SERVER,
            bindUser: process.env.CONFIG_AUTH_LDAP_BIND_USER,
            bindPassword: process.env.CONFIG_AUTH_LDAP_BIND_PASSWORD,
            baseDN: process.env.CONFIG_AUTH_LDAP_BASE_DN,
            userAttribute: process.env.CONFIG_AUTH_LDAP_USER_ATTRIBUTE,
        },
        github: {
            organization: process.env.CONFIG_AUTH_GITHUB_ORGANIZATION,
        },
        azuread: {
            tenant: process.env.CONFIG_AUTH_AZUREAD_TENANT,
            client: {
              id: process.env.CONFIG_AUTH_AZUREAD_CLIENT_ID,
              secret: process.env.CONFIG_AUTH_AZUREAD_CLIENT_SECRET
            }
        }
    }
};

const config = merge(merge(defaults, devel()), providedValues) as Configuration;

validate(config).then(errors => {
    if (errors.length) {
        console.error("⛔\0 Please, revise your configuration:")
    
        for (let e of errors)
            console.error(`• ${e}`);
    
        console.error("See https://github.com/mdschweda/kubernetes-dashboard-auth for details.");
        process.exit(1);
    }
});

export default config;
