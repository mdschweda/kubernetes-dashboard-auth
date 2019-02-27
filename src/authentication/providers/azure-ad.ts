import axios from "axios";
import status from "http-status-codes";
import { stringify as urlencoded } from "querystring";
import config from "../../config";
import { IAuthenticationProvider } from "../provider";
import { Authentication, AuthenticationError } from "../authentication";

/**
 * Implements an {@link IAuthenticationProvider} that validates Azure AD accounts.
 */
export default class AzureADValidationProvider implements IAuthenticationProvider  {

    /** @inheritdoc */
    get name() : string {
        return "azuread";
    }

    /** @inheritdoc */
    get configurationErrors(): string[] {
        let errors: string[] = [];
        !config.auth.azuread.tenant && errors.push("No Azure AD tenant / directory provided.");
        !config.auth.azuread.client.id && errors.push("No client id of the Azure AD application provided.");
        !config.auth.azuread.client.secret && errors.push("No client secret of the Azure AD application provided.");
        return errors;
    }

    /** @inheritdoc */
    async authenticate(username: string, password: string, otp?: string | undefined): Promise<Authentication> {
        let resp;

        try {
            resp = await axios.post(
                `https://login.microsoftonline.com/${config.auth.azuread.tenant}/oauth2/v2.0/token`,
                urlencoded({
                    grant_type: "password",
                    client_id: config.auth.azuread.client.id,
                    client_secret: config.auth.azuread.client.secret,
                    scope: "Group.Read.All Directory.Read.All Directory.ReadWrite.All",
                    username,
                    password
                }),
                {
                    headers: { "Content-Type": "application/x-www-form-urlencoded" }
                }
            );
        } catch (e) {
            if (e.response && e.response.status === status.UNAUTHORIZED && e.response.data) {
                if (e.response.data.error === "invalid_client")
                    console.error("[Azure AD] Client is misconfigured.");
            } else if (e.response &&  e.response.status === status.BAD_REQUEST) {
                if (e.response.data.error === "invalid_grant" && e.response.data.suberror === "consent_required")
                    console.error("[Azure AD] Client requires onetime administrator consent.");
                else
                    return Authentication.Fail(AuthenticationError.BadCredentials);
            }

            return Authentication.Fail(AuthenticationError.Other);
        }

        if (resp.status === status.OK)
            try {
                let accessToken = resp.data.access_token as string;
                resp = await axios.post(
                    "https://graph.microsoft.com/v1.0/me/getMemberGroups",
                    {
                        securityEnabledOnly: false 
                    },
                    {
                        headers: {
                            "Authorization": `Bearer ${accessToken}`
                        }
                    }
                );

                if (resp.status !== status.OK)
                    throw new Error(resp.data);

                let groups = resp.data && resp.data.value && resp.data.value as string[];
                Authentication.Success(username, groups);
            } catch(e) {
                console.error(`[Azure AD] Error while retrieving groups: ${e}`);
            }

        return Authentication.Fail(AuthenticationError.Other);
    }

}
