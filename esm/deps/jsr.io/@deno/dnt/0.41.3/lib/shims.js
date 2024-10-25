// Copyright 2018-2024 the Deno authors. MIT license.
export function shimOptionsToTransformShims(options) {
    const shims = [];
    const testShims = [];
    if (typeof options.deno === "object") {
        add(options.deno.test, getDenoTestShim);
    }
    else {
        add(options.deno, getDenoShim);
    }
    add(options.blob, getBlobShim);
    add(options.crypto, getCryptoShim);
    add(options.prompts, getPromptsShim);
    add(options.timers, getTimersShim);
    add(options.domException, getDomExceptionShim);
    add(options.undici, getUndiciShim);
    add(options.weakRef, getWeakRefShim);
    add(options.webSocket, getWebSocketShim);
    if (options.custom) {
        shims.push(...options.custom);
        testShims.push(...options.custom);
    }
    if (options.customDev) {
        testShims.push(...options.customDev);
    }
    return {
        shims,
        testShims,
    };
    function add(option, getShim) {
        if (option === true) {
            shims.push(getShim());
            testShims.push(getShim());
        }
        else if (option === "dev") {
            testShims.push(getShim());
        }
    }
}
function getDenoShim() {
    return {
        package: {
            name: "@deno/shim-deno",
            version: "~0.18.0",
        },
        globalNames: ["Deno"],
    };
}
function getDenoTestShim() {
    return {
        package: {
            name: "@deno/shim-deno-test",
            version: "~0.5.0",
        },
        globalNames: ["Deno"],
    };
}
function getCryptoShim() {
    return {
        package: {
            name: "@deno/shim-crypto",
            version: "~0.3.1",
        },
        globalNames: [
            "crypto",
            typeOnly("Crypto"),
            typeOnly("SubtleCrypto"),
            typeOnly("AlgorithmIdentifier"),
            typeOnly("Algorithm"),
            typeOnly("RsaOaepParams"),
            typeOnly("BufferSource"),
            typeOnly("AesCtrParams"),
            typeOnly("AesCbcParams"),
            typeOnly("AesGcmParams"),
            typeOnly("CryptoKey"),
            typeOnly("KeyAlgorithm"),
            typeOnly("KeyType"),
            typeOnly("KeyUsage"),
            typeOnly("EcdhKeyDeriveParams"),
            typeOnly("HkdfParams"),
            typeOnly("HashAlgorithmIdentifier"),
            typeOnly("Pbkdf2Params"),
            typeOnly("AesDerivedKeyParams"),
            typeOnly("HmacImportParams"),
            typeOnly("JsonWebKey"),
            typeOnly("RsaOtherPrimesInfo"),
            typeOnly("KeyFormat"),
            typeOnly("RsaHashedKeyGenParams"),
            typeOnly("RsaKeyGenParams"),
            typeOnly("BigInteger"),
            typeOnly("EcKeyGenParams"),
            typeOnly("NamedCurve"),
            typeOnly("CryptoKeyPair"),
            typeOnly("AesKeyGenParams"),
            typeOnly("HmacKeyGenParams"),
            typeOnly("RsaHashedImportParams"),
            typeOnly("EcKeyImportParams"),
            typeOnly("AesKeyAlgorithm"),
            typeOnly("RsaPssParams"),
            typeOnly("EcdsaParams"),
        ],
    };
}
function getBlobShim() {
    return {
        module: "buffer",
        globalNames: ["Blob"],
    };
}
function getPromptsShim() {
    return {
        package: {
            name: "@deno/shim-prompts",
            version: "~0.1.0",
        },
        globalNames: ["alert", "confirm", "prompt"],
    };
}
function getTimersShim() {
    return {
        package: {
            name: "@deno/shim-timers",
            version: "~0.1.0",
        },
        globalNames: ["setInterval", "setTimeout"],
    };
}
function getUndiciShim() {
    return {
        package: {
            name: "undici",
            version: "^6.0.0",
        },
        globalNames: [
            "fetch",
            "File",
            "FormData",
            "Headers",
            "Request",
            "Response",
            typeOnly("BodyInit"),
            typeOnly("HeadersInit"),
            typeOnly("ReferrerPolicy"),
            typeOnly("RequestInit"),
            typeOnly("RequestCache"),
            typeOnly("RequestMode"),
            typeOnly("RequestRedirect"),
            typeOnly("ResponseInit"),
        ],
    };
}
function getDomExceptionShim() {
    return {
        package: {
            name: "domexception",
            version: "^4.0.0",
        },
        typesPackage: {
            name: "@types/domexception",
            version: "^4.0.0",
        },
        globalNames: [{
                name: "DOMException",
                exportName: "default",
            }],
    };
}
function getWeakRefShim() {
    return {
        package: {
            name: "@deno/sham-weakref",
            version: "~0.1.0",
        },
        globalNames: ["WeakRef", typeOnly("WeakRefConstructor")],
    };
}
function getWebSocketShim() {
    return {
        package: {
            name: "ws",
            version: "^8.13.0",
        },
        typesPackage: {
            name: "@types/ws",
            version: "^8.5.4",
            peerDependency: false,
        },
        globalNames: [{
                name: "WebSocket",
                exportName: "default",
            }],
    };
}
function typeOnly(name) {
    return {
        name,
        typeOnly: true,
    };
}
