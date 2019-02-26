import { IAuthenticationProvider, AuthenticationResult } from "../provider";

/**
 * Implements an {@link IAuthenticationProvider} for testing purposes. This provider is not intended for usage in
 * production environments.
 * 
 * User/password combinations:
 * - `foo`:`bar` - Valid user
 * - `otp`:`otp` - User with 2FA enabled (valid code: 123)
 * - `john`:`doe` - User without access to the resource
 * - `bad`:`food` - Raises an error 
 */
export default class TestValidationProvider implements IAuthenticationProvider  {

    get name() : string {
        return "test";
    }

    get configurationErrors(): string[] {
        return [];
    }

    async authenticate(user: string, password: string, otp?: string | undefined): Promise<AuthenticationResult> {
        if (process.env.NODE_ENV !== "development")
            throw Error("Not supported in production environments.");

        if (user === "foo" && password === "bar")
            return AuthenticationResult.Success;

        if (user === "otp" && password === "otp")
            return otp === "123" ? AuthenticationResult.Success : AuthenticationResult.OtpChallenge;

        if (user === "john" && password === "doe")
            return AuthenticationResult.Forbidden;

        if (user === "bad" && password === "food")
            return AuthenticationResult.Error;

        return AuthenticationResult.BadCredentials;
    }

}


