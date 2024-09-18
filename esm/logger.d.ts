/** a module for simplifying logging with a global state.
 * intended mostly for internal use.
 *
 * @module
*/
/// <reference types="node" />
import type { BaseBuildConfig } from "./typedefs.js";
export type LogLevel = Exclude<NonNullable<BaseBuildConfig["log"]>, boolean>;
export interface LogConfig {
    log?: BaseBuildConfig["log"];
    [ignored_props: string]: any;
}
export declare const console_assert: {
    (condition?: boolean | undefined, ...data: any[]): void;
    (value: any, message?: string | undefined, ...optionalParams: any[]): void;
}, console_clear: {
    (): void;
    (): void;
}, console_debug: {
    (...data: any[]): void;
    (message?: any, ...optionalParams: any[]): void;
}, console_dir: {
    (item?: any, options?: any): void;
    (obj: any, options?: import("util").InspectOptions | undefined): void;
}, console_error: {
    (...data: any[]): void;
    (message?: any, ...optionalParams: any[]): void;
}, console_log: {
    (...data: any[]): void;
    (message?: any, ...optionalParams: any[]): void;
}, console_table: {
    (tabularData?: any, properties?: string[] | undefined): void;
    (tabularData: any, properties?: readonly string[] | undefined): void;
}, console_warn: {
    (...data: any[]): void;
    (message?: any, ...optionalParams: any[]): void;
};
/** set the logging to a certain level.
 * the value passed to this function affects the logging behavior of the {@link logBasic} and {@link logVerbose} functions.
 *
 * possible options:
 * - `{ log: undefined }`: logging level is unchanged. by default, it starts with `"basic"`.
 * - `{ log: "none" }`: no logging occurs (neither {@link logBasic} nor {@link logVerbose} print anything).
 * - `{ log: "basic" }`: basic logging occurs ({@link logBasic} prints, but {@link logVerbose} does not print).
 * - `{ log: "verbose" }`: basic logging + verbose logging occurs ({both @link logBasic} and {@link logVerbose} print).
*/
export declare const setLog: (config: LogConfig) => void;
export declare const logBasic: (...data: any[]) => void, logVerbose: (...data: any[]) => void;
//# sourceMappingURL=logger.d.ts.map