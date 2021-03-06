import ldap from "ldapjs";
import { IAuthenticationProvider } from "../provider";
import { default as config, ConfigurationAudit } from "../../config";
import { Authentication, AuthenticationError } from "../authentication";

/**
 * Provides methods to search a LDAP directory.
 */
class LdapClient {

    private readonly client: ldap.Client;

    /**
     * Creates a new instance of the class.
     */
    constructor() {
        this.client = ldap.createClient({
            url: config.auth.ldap.server
        });
    }

    /**
     * Binds an user account to the client used for subsequent operations.
     * @param dn The distinguished name of the user.
     * @param password The user's password.
     */
    bind(dn: string, password: string) : Promise<any> {
        return new Promise((resolve, reject) => {
            this.client.bind(dn, password, (err, result) => {
                if (err)    
                    reject(err);
    
                resolve(result);
            });
        });
    }

    /**
     * Closes the session previously established by the bind command. 
     */
    unbind() : Promise<void> {
        return new Promise((resolve, reject) => {
            this.client.unbind(err => {
                if (err)    
                    reject(err);

                resolve();
            });
        });
    }

    /**
     * Searches the LDAP directory structure.
     * @param baseDN The distinguished name of the entity where to search in.
     * @param searchOptions The search options.
     */
    search(baseDN: string, searchOptions: ldap.SearchOptions): Promise<any> {
        return new Promise((resolve, reject) => {
            this.client.search(baseDN, searchOptions, (err, result) => {
                if (err)
                    reject(err);
    
                result.on("searchEntry", entry => resolve(entry.object));
                result.on("error", err => reject(err));
                result.on("end", result => {
                    if (!result.status)
                        resolve(null);
                 });
    
            })
        });
    }

}

/**
 * Implements an {@link IAuthenticationProvider} that uses LDAP for validation.
 */
export default class LDAPValidationProvider implements IAuthenticationProvider  {

    /** @inheritdoc */
    get name() : string {
        return "ldap";
    }

    /** @inheritdoc */
    validateConfiguration(): ConfigurationAudit {
        let result: ConfigurationAudit = {
            errors: [],
            warnings: []
        };

        !config.auth.ldap.server && result.errors.push("No ldap server address specified.");
        !config.auth.ldap.bindUser && result.errors.push("No ldap bind user specified.");
        !config.auth.ldap.bindPassword && result.errors.push("No ldap bind password specified.");
        
        return result;
    }

    /** @inheritdoc */
    async authenticate(username: string, password: string): Promise<Authentication> {
        let client = new LdapClient();

        try {
            await client.bind(config.auth.ldap.bindUser, config.auth.ldap.bindPassword);
        } catch (e) {
            console.error(`[LDAP] Bind failed: ${e}`);
            return Authentication.Fail(AuthenticationError.Other);
        }

        let match;

        try {
            match = await client.search(config.auth.ldap.baseDN, {
                scope: "sub",
                filter: `(${config.auth.ldap.userAttribute}=${username})`
            });
        } catch (e) {
            console.error(`[LDAP] Searching the directory failed: ${e}`);
            return Authentication.Fail(AuthenticationError.Other);
        }

        if (match) {
            try {
                if (!await client.bind(match.dn, password))
                    return Authentication.Fail(AuthenticationError.BadCredentials);
            } catch {
                return Authentication.Fail(AuthenticationError.BadCredentials);
            }
        } else {
            return Authentication.Fail(AuthenticationError.BadCredentials);
        }

        await client.unbind();
        return Authentication.Success(username, match.memberOf);
    }
    
}
