/**
 * String -> Base64.
 * @param s Raw string.
 * @returns Base64 encoded string.
 */
export function encode(s: string | undefined): string | undefined {
    return s && Buffer.from(s).toString("base64");
}

/**
 * Base64 -> String.
 * @param s Base64 encoded string.
 * @returns Raw string.
 */
export function decode(s: string | undefined): string | undefined {
    return s && Buffer.from(s, "base64").toString();
}
