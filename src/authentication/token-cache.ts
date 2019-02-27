import axios, { AxiosRequestConfig } from "axios";
import { Agent } from "https";
import status from "http-status-codes";
import config from "../config";

interface TokenSecret {
    data: {
        token: string
    }
}

interface ServiceAccountList {
    items: {
        metadata: {
            name: string;
            namespace: string;
        };

        secrets: {
            name: string;
        }[]
    }[];
}

export default class TokenCache {

    private static readonly _cache = new Map<string, string>();

    private static readonly bearerAuth : AxiosRequestConfig = {
        headers: {
            "Authorization": `Bearer ${config.api.token}`
        },
        httpsAgent: new Agent({
            rejectUnauthorized: false
        })
    };

    static async getToken(serviceAccount: string, namespace: string = "default") : Promise<string | undefined> {
        serviceAccount = serviceAccount && serviceAccount.toLowerCase();
        namespace = namespace && namespace.toLowerCase() || "default";

        if (this._cache.has(`${namespace}/${serviceAccount}`))
            return this._cache.get(`${namespace}/${serviceAccount}`);

        try {
            let resp = await axios.get(this.apiEndpoint("/serviceaccounts"), this.bearerAuth);
            if (resp.status === status.OK) {
                let serviceAccounts = resp.data as ServiceAccountList;
                let match = serviceAccounts.items.find(acc =>
                    acc.metadata.name.toLowerCase() === serviceAccount &&
                    acc.metadata.namespace.toLowerCase() === namespace
                );

                let secret = match && match.secrets.length && match.secrets[0].name;
                if (secret) {
                    resp = await axios.get(this.apiEndpoint(`/namespaces/${namespace}/secrets/${secret}`), this.bearerAuth);
                    if (resp.status === status.OK) {
                        let token = (resp.data as TokenSecret).data.token;
                        if (token) {
                            this._cache.set(`${namespace}/${serviceAccount}`, token);
                            return token;
                        }
                    }
                }
            }
            return "";
        } catch(e) {
            console.error(`Error retrieving service account token: ${e}`);
        }
    }

    private static apiEndpoint(path: string) {
        return config.api.server.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
    };

}
