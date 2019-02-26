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

    async authenticate(username: string, password: string, otp?: string | undefined): Promise<AuthenticationResult> {
        if (process.env.NODE_ENV !== "development")
            throw Error("Not supported in production environments.");

        if (username === "foo" && password === "bar")
            return AuthenticationResult.Success;

        if (username === "otp" && password === "otp")
            return otp === "123" ? AuthenticationResult.Success : AuthenticationResult.OtpChallenge;

        if (username === "john" && password === "doe")
            return AuthenticationResult.Forbidden;

        if (username === "bad" && password === "food")
            return AuthenticationResult.Error;

        return AuthenticationResult.BadCredentials;
    }

}


