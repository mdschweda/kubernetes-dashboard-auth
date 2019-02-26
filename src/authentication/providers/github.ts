import axios from "axios";
import status from "http-status-codes";
import config from "../../config";
import { IAuthenticationProvider, AuthenticationResult } from "../provider";

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
    async authenticate(user: string, password: string, otp?: string | undefined): Promise<AuthenticationResult> {
        try {
            let resp = await axios.get(`https://api.github.com/user/${config.auth.github.team ? "teams" : "orgs"}`, {
                auth: {
                    username: user,
                    password
                },
                headers: otp && {
                    "X-GitHub-OTP": otp
                }
            });

            if (resp.status === status.OK) {
                if (config.auth.github.team) {
                    let teams = resp.data as GitHubTeam[];
                    return teams.find(team =>
                        team.name === config.auth.github.team &&
                        team.organization.login === config.auth.github.organization
                    ) ?
                        AuthenticationResult.Success : AuthenticationResult.Forbidden;
                } else {
                    let orgs = resp.data as GitHubOrg[];
                    return orgs.find(org => org.login === config.auth.github.organization) ?
                        AuthenticationResult.Success : AuthenticationResult.Forbidden;
                }
            }
        } catch (e) {
            if (e.response && e.response.status === status.UNAUTHORIZED)
                return e.response.headers["x-github-otp"] ?
                    AuthenticationResult.OtpChallenge : AuthenticationResult.BadCredentials;
        }

        return AuthenticationResult.Error;
    }

}
