import { IAuthenticationProvider, AuthenticationResult } from "../provider";

export default class AzureADValidationProvider implements IAuthenticationProvider  {

    get name() : string {
        return "azuread";
    }

    get configurationErrors(): string[] {
        return [];
    }

    async authenticate(user: string, password: string, otp?: string | undefined): Promise<AuthenticationResult> {
        throw new Error("NYI.");
    }

}
