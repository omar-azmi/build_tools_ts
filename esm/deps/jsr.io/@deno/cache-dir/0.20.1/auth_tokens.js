// Copyright 2018-2025 the Deno authors. MIT license.
export function splitLast(value, delimiter) {
    const split = value.split(delimiter);
    return [split.slice(0, -1).join(delimiter)].concat(split.slice(-1));
}
function tokenAsValue(authToken) {
    return authToken.type === "basic"
        ? `Basic ${btoa(`${authToken.username}:${authToken.password}`)}`
        : `Bearer ${authToken.token}`;
}
export class AuthTokens {
    #tokens;
    constructor(tokensStr = "") {
        const tokens = [];
        for (const tokenStr of tokensStr.split(";").filter((s) => s.length > 0)) {
            if (tokensStr.includes("@")) {
                const [token, host] = splitLast(tokenStr, "@");
                if (token.includes(":")) {
                    const [username, password] = splitLast(token, ":");
                    tokens.push({ type: "basic", host, username, password });
                }
                else {
                    tokens.push({ type: "bearer", host, token });
                }
            }
            else {
                // todo(dsherret): feel like this should error?
                // deno-lint-ignore no-console
                console.error("Badly formed auth token discarded.");
            }
        }
        this.#tokens = tokens;
    }
    get(specifier) {
        for (const token of this.#tokens) {
            if (token.host.endsWith(specifier.host)) {
                return tokenAsValue(token);
            }
        }
    }
}
