import { IAuthenticationProvider, AuthenticationResult } from "../provider";

export default class HtpasswdValidationProvider implements IAuthenticationProvider  {

    get name() : string {
        return "htpasswd";
    }

    get configurationErrors(): string[] {
        return [];
    }

    async authenticate(username: string, password: string, otp?: string | undefined): Promise<AuthenticationResult> {
        throw new Error("NYI.");
    }

}
