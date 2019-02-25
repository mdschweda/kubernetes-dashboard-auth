import ldap from "ldapjs";
import { IAuthenticationProvider, ValidationResult } from "../provider";
import config from "../../config";

class LdapClient {

    private readonly client: ldap.Client;

    constructor() {
        this.client = ldap.createClient({
            url: config.authentication.ldap.server
        });
    }

    bind(dn: string, password: string) : Promise<any> {
        return new Promise((resolve, reject) => {
            this.client.bind(dn, password, (err, result) => {
                if (err)    
                    reject(err);
    
                resolve(result);
            });
        });
    }

    unbind() : Promise<void> {
        return new Promise((resolve, reject) => {
            this.client.unbind(err => {
                if (err)    
                    reject(err);

                resolve();
            });
        });
    }

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

export default class LDAPValidationProvider implements IAuthenticationProvider  {

    get name() : string {
        return "ldap";
    }

    get configurationErrors(): string[] {
        return [];
    }

    async authenticate(user: string, password: string): Promise<ValidationResult> {
        try {
            let client = new LdapClient();

            await client.bind(config.authentication.ldap.baseDN, config.authentication.ldap.bindPassword);
            let match = await client.search(config.authentication.ldap.baseDN, {
                scope: "sub",
                filter: `(${config.authentication.ldap.userAttribute}=${user})`
            });

            if (match) {
                if (config.authentication.ldap.group && !match.memberOf.includes(config.authentication.ldap.group))
                    return ValidationResult.Forbidden;
                else {
                    if (!await client.bind(match.dn, password))
                        return ValidationResult.BadCredentials;
                }
            } else {
                console.log("Internal Server Error");
            }
        
            await client.unbind();
        } catch(e) {
            console.error(`LDAP authentication failed: ${e}`);
            return ValidationResult.Error;
        }

        return ValidationResult.Success;
    }
    
}
