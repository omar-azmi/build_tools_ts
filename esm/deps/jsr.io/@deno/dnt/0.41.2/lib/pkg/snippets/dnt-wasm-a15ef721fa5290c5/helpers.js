import { createCache } from "../../../../../../cache-dir/0.8.0/mod.js";
const fileFetcher = createCache();
export function fetch_specifier(specifier, cacheSettingVal, checksum) {
    return fileFetcher.load(new URL(specifier), getCacheSetting(cacheSettingVal), checksum);
}
function getCacheSetting(val) {
    // WARNING: ensure this matches wasm/src/lib.rs
    switch (val) {
        case 1:
            return "use";
        case 2:
            return "reload";
        case 0:
        default:
            return "only";
    }
}