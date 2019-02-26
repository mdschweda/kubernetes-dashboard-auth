import url from "url";
import { AuthenticationProviderFactory } from "./authentication/provider";
import { Configuration } from "./config";

export default async function validate(config: Configuration) : Promise<string[]> {
    let errors = [];
    !(config.tls.cert && config.tls.key) && errors.push("Certificate improperly configured.");
    !config.auth.token && errors.push("No bearer token configured.");
    !config.auth.provider && errors.push("No authentication provider specified.")
    
    try {
        let upstream = url.parse(config.upstream);
        if (upstream.protocol !== "https:")
            upstream.protocol = "https:";
        config.upstream = url.format(upstream);
    } catch {
        errors.push("Invalid dashboard address (option 'upstream').")
    }
    
    if (config.auth.provider) {
        let provider = await AuthenticationProviderFactory.getProvider(config.auth.provider);
        if (!provider)
            errors.push(`Unknown authentication provider: ${config.auth.provider}.`);
        else
            for (var error of provider.configurationErrors)
                errors.push(error);
    }

    return errors;
}
