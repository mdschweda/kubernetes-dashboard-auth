import { promises as fs } from "fs";
import { extname, join } from "path";

export enum ValidationResult {
    Success,
    BadCredentials,
    OtpChallenge,
    BadOtp,
    Forbidden,
    Error
}

export interface IAuthenticationProvider {

    readonly name: string;
    readonly configurationErrors: string[];

    authenticate(user: string, password: string, otp?: string): Promise<ValidationResult>;
    
}

export class AuthenticationProviderFactory {

    private static providers: Map<string, () => IAuthenticationProvider>;

    static async initialize() {
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

    static async getProviders(): Promise<string[]> {
        if (!this.providers)
            await this.initialize();

        return Array.from(this.providers.keys());
    }

    static async getProvider(name: string): Promise<IAuthenticationProvider | undefined> {
        if (!this.providers)
            await this.initialize();

        name = name.toLocaleLowerCase();
        if (!this.providers.has(name))
            return;
        
        return this.providers.get(name)!();
    }

}
