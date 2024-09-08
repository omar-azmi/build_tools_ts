export interface Picocolors {
    green(text: string): string;
    red(text: string): string;
    gray(text: string): string;
}
export interface NodeProcess {
    stdout: {
        write(text: string): void;
    };
    exit(code: number): number;
}
export interface RunTestDefinitionsOptions {
    pc: Picocolors;
    process: NodeProcess;
    /** The file the tests are running in. */
    origin: string;
}
export interface TestDefinition {
    name: string;
    fn: (context: TestContext) => Promise<void> | void;
    only?: boolean;
    ignore?: boolean;
}
export interface TestContext {
    name: string;
    parent: TestContext | undefined;
    origin: string;
    err: any;
    children: TestContext[];
    hasFailingChild: boolean;
    getOutput(): string;
    step(nameOrDefinition: string | TestDefinition, fn?: (context: TestContext) => void | Promise<void>): Promise<boolean>;
    status: "ok" | "fail" | "pending" | "ignored";
}
export declare function runTestDefinitions(testDefinitions: TestDefinition[], options: RunTestDefinitionsOptions): Promise<void>;
//# sourceMappingURL=test_runner.d.ts.map