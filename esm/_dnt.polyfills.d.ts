declare global {
    interface ImportMeta {
        /** A flag that indicates if the current module is the main module that was
         * called when starting the program under Deno.
         *
         * ```ts
         * if (import.meta.main) {
         *   // this was loaded as the main module, maybe do some bootstrapping
         * }
         * ```
         */
        main: boolean;
        /** A function that returns resolved specifier as if it would be imported
         * using `import(specifier)`.
         *
         * ```ts
         * console.log(import.meta.resolve("./foo.js"));
         * // file:///dev/foo.js
         * ```
         */
        resolve(specifier: string): string;
    }
}
export {};
declare global {
    interface ArrayConstructor {
        fromAsync<T>(iterableOrArrayLike: AsyncIterable<T> | Iterable<T | Promise<T>> | ArrayLike<T | Promise<T>>): Promise<T[]>;
        fromAsync<T, U>(iterableOrArrayLike: AsyncIterable<T> | Iterable<T> | ArrayLike<T>, mapFn: (value: Awaited<T>) => U, thisArg?: any): Promise<Awaited<U>[]>;
    }
}
export {};
declare global {
    interface Error {
        cause?: unknown;
    }
}
export {};
declare global {
    interface Array<T> {
        /**
         * Returns the value of the last element in the array where predicate is true, and undefined
         * otherwise.
         * @param predicate find calls predicate once for each element of the array, in ascending
         * order, until it finds one where predicate returns true. If such an element is found, find
         * immediately returns that element value. Otherwise, find returns undefined.
         * @param thisArg If provided, it will be used as the this value for each invocation of
         * predicate. If it is not provided, undefined is used instead.
         */
        findLast<S extends T>(predicate: (this: void, value: T, index: number, obj: T[]) => value is S, thisArg?: any): S | undefined;
        findLast(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): T | undefined;
        /**
         * Returns the index of the last element in the array where predicate is true, and -1
         * otherwise.
         * @param predicate find calls predicate once for each element of the array, in ascending
         * order, until it finds one where predicate returns true. If such an element is found,
         * findIndex immediately returns that element index. Otherwise, findIndex returns -1.
         * @param thisArg If provided, it will be used as the this value for each invocation of
         * predicate. If it is not provided, undefined is used instead.
         */
        findLastIndex(predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any): number;
    }
    interface Uint8Array {
        /**
         * Returns the value of the last element in the array where predicate is true, and undefined
         * otherwise.
         * @param predicate findLast calls predicate once for each element of the array, in descending
         * order, until it finds one where predicate returns true. If such an element is found, findLast
         * immediately returns that element value. Otherwise, findLast returns undefined.
         * @param thisArg If provided, it will be used as the this value for each invocation of
         * predicate. If it is not provided, undefined is used instead.
         */
        findLast<S extends number>(predicate: (value: number, index: number, array: Uint8Array) => value is S, thisArg?: any): S | undefined;
        findLast(predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any): number | undefined;
        /**
         * Returns the index of the last element in the array where predicate is true, and -1
         * otherwise.
         * @param predicate findLastIndex calls predicate once for each element of the array, in descending
         * order, until it finds one where predicate returns true. If such an element is found,
         * findLastIndex immediately returns that element index. Otherwise, findLastIndex returns -1.
         * @param thisArg If provided, it will be used as the this value for each invocation of
         * predicate. If it is not provided, undefined is used instead.
         */
        findLastIndex(predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any): number;
    }
}
export {};
declare global {
    interface Object {
        /**
         * Determines whether an object has a property with the specified name.
         * @param o An object.
         * @param v A property name.
         */
        hasOwn(o: object, v: PropertyKey): boolean;
    }
}
export {};
//# sourceMappingURL=_dnt.polyfills.d.ts.map