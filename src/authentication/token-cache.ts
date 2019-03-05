import axios, { AxiosRequestConfig } from "axios";
import { Agent } from "https";
import status from "http-status-codes";
import config from "../config";
import { decode } from "../base64";
import { ServiceAccount, ServiceAccountList, TokenSecret } from "./service-account";

/**
 * Provides functions for retrieving and caching access tokens of Kubernetes service accounts.
 */
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

    /**
     * Retrieves the access token of a service account from the Kubernetes cluster.
     * @param serviceAccount The name of the service account.
     * @param namespace The namespace wherein the service account is defined.
     */
    static async getToken(sa: ServiceAccount) : Promise<string | undefined> {
        if (this._cache.has(sa.fqn))
            return this._cache.get(sa.fqn);

        try {
            let resp = await axios.get(this.apiEndpoint("/serviceaccounts"), this.bearerAuth);
            if (resp.status === status.OK) {
                let serviceAccounts = resp.data as ServiceAccountList;
                let match = serviceAccounts.items.find(item =>
                    item.metadata.name === sa.name.toLowerCase() &&
                    item.metadata.namespace === sa.namespace.toLowerCase()
                );

                let secret = match && match.secrets.length && match.secrets[0].name;
                if (secret) {
                    resp = await axios.get(this.apiEndpoint(`/namespaces/${sa.namespace}/secrets/${secret}`), this.bearerAuth);
                    if (resp.status === status.OK) {
                        let token = decode((resp.data as TokenSecret).data.token);
                        if (token) {
                            this._cache.set(sa.fqn, decode(token)!);
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

    // Combine URL path
    private static apiEndpoint(path: string) {
        return config.api.server.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
    };

}
