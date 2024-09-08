export function isObject(object) {
    return typeof object == "object" && object !== null &&
        object.constructor === Object;
}
export function sortObject(normalized) {
    const sorted = {};
    const sortedKeys = Object.keys(normalized)
        .sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
        sorted[key] = normalized[key];
    }
    return sorted;
}
export function isImportMap(importMap) {
    return isObject(importMap) &&
        (importMap.imports !== undefined ? isImports(importMap.imports) : true) &&
        (importMap.scopes !== undefined ? isScopes(importMap.scopes) : true);
}
export function isImports(importsMap) {
    return isObject(importsMap);
}
export function isScopes(scopes) {
    return isObject(scopes) &&
        Object.values(scopes).every((value) => isSpecifierMap(value));
}
export function isSpecifierMap(specifierMap) {
    return isObject(specifierMap);
}
export function isURL(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
