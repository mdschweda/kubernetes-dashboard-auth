import { IAuthenticationProvider, ValidationResult } from "../provider";

export default class TestValidationProvider implements IAuthenticationProvider  {

    get name() : string {
        return "test";
    }

    get configurationErrors(): string[] {
        return [];
    }

    async authenticate(user: string, password: string, otp?: string | undefined): Promise<ValidationResult> {
        if (process.env.NODE_ENV !== "development")
            throw Error("Not supported on production environment!");

        if (user === "foo" && password === "bar")
            return ValidationResult.Success;

        if (user === "otp" && password === "otp")
            return otp === "123" ? ValidationResult.Success : ValidationResult.OtpChallenge;

        if (user === "john" && password === "doe")
            return ValidationResult.Forbidden;

        if (user === "bad" && password === "food")
            return ValidationResult.Error;

        return ValidationResult.BadCredentials;
    }

}


