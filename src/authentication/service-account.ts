/**
 * Represents data returned from the Kubernetes `/secrets/{name}` endpoint.
 */
export interface TokenSecret {
    data: {
        token: string
    }
}

/**
 * Represents data returned from the Kubernetes `/servicaccounts` endpoint.
 */
export interface ServiceAccountList {
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

/**
 * Represent a Kubernetes service account.
 */
export class ServiceAccount {

    /**
     * The namespace wherein the service account is defined.
     */
    readonly namespace: string;

    /**
     * The name of the service account.
     */
    readonly name: string;
    
    /**
     * The fully qualified name the the service account.
     */
    get fqn() {
        return this.namespace === "default" ? this.name : `${this.namespace}/${this.name}`;
    }

    /**
     * Creates a new instance of the class.
     * @param fqn The fully qualified name the the service account.
     */
    constructor(fqn: string) {
        if (!fqn)
            throw new Error("Empty service account id.");

        let tokens = fqn.trim().split("/", 2);
        if (tokens.length === 2) {
            this.namespace = tokens[0];
            this.name = tokens[1];
        } else {
            this.namespace = "default";
            this.name = fqn;
        }
    }

}
