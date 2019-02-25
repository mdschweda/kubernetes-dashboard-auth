import { IAuthenticationProvider, ValidationResult } from "../provider";

export default class HtpasswdValidationProvider implements IAuthenticationProvider  {

    get name() : string {
        return "htpasswd";
    }

    get configurationErrors(): string[] {
        return [];
    }

    async authenticate(user: string, password: string, otp?: string | undefined): Promise<ValidationResult> {
        throw new Error("NYI.");
    }

}
