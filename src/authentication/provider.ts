import { promises as fs } from "fs";
import { extname, join } from "path";
import { Authentication } from "./authentication";

/**
 * Provides methods for validating user credentials.
 */
export interface IAuthenticationProvider {

    /**
     * The unique name of the provider.
     */
    readonly name: string;

    /**
     * Gets all provider configuration errors.
     */
    readonly configurationErrors: string[];

    /**
     * 
     * @param username The username.
     * @param password The user's password.
     * @param otp An optional validation code (one time password).
     */
    authenticate(username: string, password: string, otp?: string): Promise<Authentication>;
    
}

/**
 * Creates instaces of {@link IAuthenticationProvider}.
 */
export class AuthenticationProviderFactory {

    private static providers: Map<string, () => IAuthenticationProvider>;

    /**
     * Initializes the available authentication providers.
     */
    private static async initialize() {
        let providers = new Map<string, () => IAuthenticationProvider>();

        for (var file of await fs.readdir(join(__dirname, "providers"))) {
            let ext = extname(file);
            if (ext === ".js" || ext === ".ts") {
                try {
                    let provider = await import(join(__dirname, "providers", file));
                    let factory = () => <IAuthenticationProvider>new provider.default();
                    providers.set(factory().name, factory);
                } catch(e) {
                    console.log(e);
                }
                
            }
        }

        this.providers = providers;
    }

    /**
     * Gets the name of the available authentication providers.
     */
    static async getProviders(): Promise<string[]> {
        if (!this.providers)
            await this.initialize();

        return Array.from(this.providers.keys());
    }

    /**
     * Creates an instance of an authentication provider given its name.
     * @param name The unique name of the authentication provider.
     */
    static async getProvider(name: string): Promise<IAuthenticationProvider | undefined> {
        if (!this.providers)
            await this.initialize();

        name = name.toLocaleLowerCase();
        if (!this.providers.has(name))
            return;
        
        return this.providers.get(name)!();
    }

}
