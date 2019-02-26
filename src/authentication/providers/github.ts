import axios from "axios";
import status from "http-status-codes";
import config from "../../config";
import { IAuthenticationProvider, AuthenticationResult } from "../provider";

/**
 * An excerpt of the GitHub's API organizations endpoint response
 * @see {@link https://developer.github.com/v3/orgs/}
 */
interface GitHubOrg {
    id: number;
    login: string;
    url: string;
}

/**
 * Implements an {@link IAuthenticationProvider} that validates GitHub accounts.
 */
export default class GitHubValidationProvider implements IAuthenticationProvider  {

    /** @inheritdoc */
    get name() : string {
        return "github";
    }

    /** @inheritdoc */
    get configurationErrors(): string[] {
        let errors: string[] = [];
        !config.auth.github.organization && errors.push("No GitHub organization provided.");
        return errors;
    }
    
    /** @inheritdoc */
    async authenticate(user: string, password: string, otp?: string | undefined): Promise<AuthenticationResult> {
        try {
            let resp = await axios.get("https://api.github.com/user/orgs", {
                auth: {
                    username: user,
                    password
                },
                headers: otp && {
                    "X-GitHub-OTP": otp
                }
            });

            if (resp.status === status.OK) {
                let orgs = resp.data as GitHubOrg[];
                return orgs.find(org => org.login === config.auth.github.organization) ?
                    AuthenticationResult.Success : AuthenticationResult.Forbidden;
            }
        } catch (e) {
            if (e.response && e.response.status === status.UNAUTHORIZED)
                return e.response.headers["x-github-otp"] ?
                    AuthenticationResult.OtpChallenge : AuthenticationResult.BadCredentials;
        }

        return AuthenticationResult.Error;
    }

}
