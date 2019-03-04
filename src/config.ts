import fs from "fs";
import path from "path";
import { merge } from "lodash";
import { encode as toBase64 } from "./base64";

const __root = path.parse(__dirname).root;

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

// Get api server address from Kubernetes environment variables
function apiServerAddress() {
    if (process.env.KUBERNETES_SERVICE_HOST && process.env.KUBERNETES_PORT_443_TCP_PORT)
        return `https://${process.env.KUBERNETES_SERVICE_HOST}:${process.env.KUBERNETES_PORT_443_TCP_PORT}/api/v1/`;
}

function toKeyValuePairs(s: string | undefined) {
    let map : { [key: string]: string } = { };
    if (s) {
        for (let ln of s.split(/\r?\n/)) {
            let tokens = ln.split("=", 2);
            if (tokens.length === 2 && tokens[0] && tokens[1]) {
                map[tokens[0]] = tokens[1];
            }
        }
    }
    return map;
}

function fromFile(...paths: string[]): string | undefined {
    let file = path.join(...paths);
    if (fs.existsSync(file)) {
        let stat = fs.lstatSync(file);
        if (stat.isSymbolicLink())
            return fromFile(fs.realpathSync(file));
        else if (stat.isFile())
            return fs.readFileSync(file).toString().trim();
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
    /** The authentication and authorization configuration. */
    auth: {
        /** The authentication provider used to validate user accounts. */
        provider: string;
        /** The ACL (access control list) that maps users to Kubernetes service accounts. Default is `kube-system/kubernetes-dashboard`. */
        acl: {
            /** The service account used when no entry in `users` or `groups` matches the authenticated user. Default is `kube-system/kubernetes-dashboard`. Unset this value to whitelist authorized users. */
            fallback: string | undefined,
            /** Key-value-pairs mapping user names to Kubernetes service accounts. */
            users: {
                [name: string]: string
            },
            /** Key-value-pairs mapping user group names to Kubernetes service accounts. The `auth.provider` implementations define what is considered a group. */
            groups: {
                [name: string]: string
            }
        },
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
    upstream: "https://kubernetes-dashboard.kube-system.svc.cluster.local/",
    auth: {
        ldap: {
            userAttribute: "sAMAccountName"
        }
    }
};

const providedValues = {
    upstream: process.env.CONFIG_UPSTREAM,
    api: {
        server: apiServerAddress(),
        token: fromFile(__root, "run", "secrets", "kubernetes.io", "serviceaccount", "token")
    },
    tls: {
        cert: toBase64(fromFile(__dirname, "cert", "server.crt")),
        key: toBase64(fromFile(__dirname, "cert", "server.key")),
    },
    auth: {
        provider: process.env.CONFIG_AUTH_PROVIDER,
        acl: {
            fallback: fromFile(__dirname, "acl", "fallback"),
            users: toKeyValuePairs(fromFile(__dirname, "acl", "users")),
            groups: toKeyValuePairs(fromFile(__dirname, "acl", "groups"))
        },
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

/** The result of the configuration validation / sanitization. */
export interface ConfigurationAudit {
    /** Critical configuration errors. */
    errors: string[],
    /** Non-critical configuration errors. */
    warnings: string[]
}

const config = merge(merge(defaults, devel()), providedValues) as Configuration;

export default config;
