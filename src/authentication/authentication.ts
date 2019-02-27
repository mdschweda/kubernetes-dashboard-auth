import config from "../config";

/**
 * Possible result of an user authentication.
 */
export enum AuthenticationError {
    /** The provided credentials were invalid. */
    BadCredentials,
    /** The user has been asked to enter an validation code. */
    OtpChallenge,
    /** The provided validation code was invalid. */
    BadOtp,
    /** The authenticated user is not allowed to use the resource. */
    Forbidden,
    /** An error occured while validating the user credentials. */
    Other
}

export class Authentication {

    readonly error: AuthenticationError | undefined;
    readonly username: string | undefined;
    readonly groups: string[];

    private constructor(result: AuthenticationError | undefined, username: string | undefined, groups: string[] | undefined) {
        this.error = result;
        this.username = username;
        this.groups = groups || [];
    }

    static Success(username: string, groups: string[] | undefined) {
        return new Authentication(undefined, username, groups);
    }

    static Fail(error: AuthenticationError) {
        return new Authentication(error, undefined, undefined);
    }

    getServiceAccount() {
        if (this.error || !this.username)
            return;

        if (typeof config.auth.acl === "string")
            return config.auth.acl;
        else if (config.auth.acl) {
            if (config.auth.acl.users && Object.keys(config.auth.acl.users).includes(this.username))
                return config.auth.acl.users[this.username];
            else if (config.auth.acl.groups) {
                let group = Object.keys(config.auth.acl.groups).find(g => this.groups.includes(g));
                if (group)
                    return config.auth.acl.groups[group];
            }
                
            return config.auth.acl.fallback;
        }
    }
}
