import axios from "axios";
import status from "http-status-codes";
import config from "../../config";
import { IAuthenticationProvider } from "../provider";
import { Authentication, AuthenticationError } from "../authentication";

/**
 * An excerpt of the GitHub's API organizations endpoint response
 * @see {@link https://developer.github.com/v3/orgs/#list-your-organizations}
 */
interface GitHubOrg {
    id: number;
    login: string;
}

/**
 * An excerpt of the GitHub's API teams endpoint response
 * @see {@link https://developer.github.com/v3/teams/#list-user-teams}
 */
interface GitHubTeam {
    id: number;
    name: string;
    description: string;
    organization: GitHubOrg;
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
    async authenticate(username: string, password: string, otp?: string | undefined): Promise<Authentication> {
        const authHeader = {
            auth: {
                username,
                password
            },
            headers: otp && {
                "X-GitHub-OTP": otp
            }
        };

        try {
            let resp = await axios.get("https://api.github.com/user/orgs", authHeader);
            if (resp.status === status.OK) {
                let orgs = resp.data as GitHubOrg[];
                if (!orgs.find(org => org.login === config.auth.github.organization))
                    return Authentication.Fail(AuthenticationError.Forbidden);
            
                resp = await axios.get("https://api.github.com/user/teams", authHeader);
                if (resp.status === status.OK) {
                    let teams = (resp.data as GitHubTeam[]).map(team => team.name);
                    return Authentication.Success(username, teams);
                }
            }
        } catch (e) {
            if (e.response && e.response.status === status.UNAUTHORIZED)
                if (!e.response.headers["x-github-otp"])
                    return Authentication.Fail(AuthenticationError.BadCredentials);
                else
                    return Authentication.Fail(otp ? AuthenticationError.BadOtp : AuthenticationError.OtpChallenge);
        }

        return Authentication.Fail(AuthenticationError.Other);
    }

}
