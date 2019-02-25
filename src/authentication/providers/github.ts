import axios from "axios";
import status from "http-status-codes";
import config from "../../config";
import { IAuthenticationProvider, ValidationResult } from "../provider";

interface GitHubOrg {
    id: number;
    login: string;
    url: string;
}

export default class GitHubValidationProvider implements IAuthenticationProvider  {

    get name() : string {
        return "github";
    }

    get configurationErrors(): string[] {
        let errors: string[] = [];
        !config.authentication.github.organization && errors.push("No GitHub organization provided.");
        return errors;
    }
    
    async authenticate(user: string, password: string, otp?: string | undefined): Promise<ValidationResult> {
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
                return orgs.find(org => org.login === config.authentication.github.organization) ?
                    ValidationResult.Success : ValidationResult.Forbidden;
            }
        } catch (e) {
            if (e.response && e.response.status === status.UNAUTHORIZED)
                return e.response.headers["x-github-otp"] ?
                    ValidationResult.OtpChallenge : ValidationResult.BadCredentials;
        }

        return ValidationResult.Error;
    }

}
