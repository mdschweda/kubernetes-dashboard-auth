import config from "../config";
import { ServiceAccount } from "./service-account";

/**
 * Possible errors during an user authentication.
 */
export enum AuthenticationError {
    /** The provided credentials were invalid. */
    BadCredentials = "BadCredentials",
    /** The user has been asked to enter an validation code. */
    OtpChallenge = "OtpChallenge",
    /** The provided validation code was invalid. */
    BadOtp = "BadOtp",
    /** The authenticated user is not allowed to use the resource. */
    Forbidden = "Forbidden",
    /** An error occured while validating the user credentials. */
    Other = "Other"
}

export class Authentication {

    /**
     * The error that occured during authentication.
     */
    readonly error: AuthenticationError | undefined;

    /**
     * The name of the authenticated user or `undefined` if the authentication was unsuccessful.
     */
    readonly username: string | undefined;

    /**
     * The groups the user is a member of. The authentication provider implementations define what
     * is considered a group.
     */
    readonly groups: string[];

    private constructor(result: AuthenticationError | undefined, username: string | undefined, groups: string[] | undefined) {
        this.error = result;
        this.username = username;
        this.groups = groups || [];
    }

    /**
     * Creates an instance of of the {@link Authentication} class for successful authentications.
     * @param username The username.
     * @param groups The groups the user is a member of. The authentication provider implementations define
     * what is considered a group.
     * @returns {Authentication} An instance of the {@link Authentication} class.
     */
    static Success(username: string, groups: string[] | undefined) {
        return new Authentication(undefined, username, groups);
    }

    /**
     * Creates an instance of of the {@link Authentication} class for unsuccessful authentications.
     * @param error The error that occured during authentication.
     * @returns {Authentication} An instance of the {@link Authentication} class.
     */
    static Fail(error: AuthenticationError) {
        return new Authentication(error, undefined, undefined);
    }

    /**
     * Retrieves the Kubernetes service account associated with the user.
     * @returns {ServiceAccount | undefined} The service account associated with the user or `undefined` for
     * unauthorized users.
     */
    getServiceAccount() {
        if (this.error || !this.username)
            return;

        if (typeof config.auth.acl === "string")
            return new ServiceAccount(config.auth.acl);
        else if (config.auth.acl) {
            if (config.auth.acl.users && Object.keys(config.auth.acl.users).includes(this.username))
                return new ServiceAccount(config.auth.acl.users[this.username]);
            else if (config.auth.acl.groups) {
                let group = Object.keys(config.auth.acl.groups).find(g => this.groups.includes(g));
                if (group)
                    return new ServiceAccount(config.auth.acl.groups[group]);
            }
                
            return config.auth.acl.fallback && new ServiceAccount(config.auth.acl.fallback) || undefined;
        }
    }

}
