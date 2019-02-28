import { IAuthenticationProvider } from "../provider";
import { Authentication, AuthenticationError } from "../authentication";

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

    /** @inheritdoc */
    get name() : string {
        return "test";
    }

    /** @inheritdoc */
    get configurationErrors(): string[] {
        return [];
    }

    /** @inheritdoc */
    async authenticate(username: string, password: string, otp?: string | undefined): Promise<Authentication> {
        if (process.env.NODE_ENV !== "development")
            throw Error("Not supported in production environments.");

        if (username === "foo" && password === "bar")
            return Authentication.Success(username, [ "GroupA", "GroupB" ]);

        if (username === "otp" && password === "otp")
            return otp === "123" ?
                Authentication.Success(username, []) : Authentication.Fail(AuthenticationError.OtpChallenge);

        if (username === "john" && password === "doe")
            return Authentication.Fail(AuthenticationError.Forbidden);

        if (username === "bad" && password === "food")
            return Authentication.Fail(AuthenticationError.Other);

        return Authentication.Fail(AuthenticationError.BadCredentials);
    }

}


