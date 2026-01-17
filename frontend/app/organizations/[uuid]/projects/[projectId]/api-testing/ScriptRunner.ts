export interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
}

export interface ScriptExecutionResult {
    tests: TestResult[];
    logs: string[];
    environmentUpdates: Record<string, string>;
}

export class ScriptRunner {
    static execute(
        script: string,
        context: {
            response?: any;
            environment?: Record<string, string>;
            variables?: Record<string, string>;
        }
    ): ScriptExecutionResult {
        const tests: TestResult[] = [];
        const logs: string[] = [];
        const environmentUpdates: Record<string, string> = { ...context.environment };

        const pm = {
            test: (name: string, callback: () => void) => {
                try {
                    callback();
                    tests.push({ name, passed: true });
                } catch (err: any) {
                    tests.push({ name, passed: false, error: err.message });
                }
            },
            expect: (value: any) => {
                return {
                    to: {
                        be: {
                            oneOf: (arr: any[]) => {
                                if (!arr.includes(value)) {
                                    throw new Error(`Expected ${value} to be one of [${arr.join(', ')}]`);
                                }
                            },
                            below: (limit: number) => {
                                if (value >= limit) {
                                    throw new Error(`Expected ${value} to be below ${limit}`);
                                }
                            },
                            above: (limit: number) => {
                                if (value <= limit) {
                                    throw new Error(`Expected ${value} to be above ${limit}`);
                                }
                            }
                        },
                        have: {
                            status: (status: number) => {
                                if (context.response?.status !== status) {
                                    throw new Error(`Expected status ${status} but got ${context.response?.status}`);
                                }
                            },
                            header: (key: string) => {
                                if (!context.response?.headers?.[key] && !context.response?.headers?.[key.toLowerCase()]) {
                                    throw new Error(`Expected header "${key}" to be present`);
                                }
                            }
                        },
                        eql: (expected: any) => {
                            if (JSON.stringify(value) !== JSON.stringify(expected)) {
                                throw new Error(`Expected ${JSON.stringify(value)} to equal ${JSON.stringify(expected)}`);
                            }
                        }
                    }
                };
            },
            response: {
                status: context.response?.status,
                headers: context.response?.headers,
                responseTime: context.response?.time,
                json: () => context.response?.body,
                to: {
                    have: {
                        status: (status: number) => {
                            if (context.response?.status !== status) {
                                throw new Error(`Expected status ${status} but got ${context.response?.status}`);
                            }
                        }
                    }
                }
            },
            environment: {
                set: (key: string, value: string) => {
                    environmentUpdates[key] = value;
                },
                get: (key: string) => {
                    return environmentUpdates[key];
                },
                unset: (key: string) => {
                    delete environmentUpdates[key];
                }
            },
            log: (...args: any[]) => {
                logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
            }
        };

        try {
            // Execute script within the context of 'pm'
            const fn = new Function('pm', script);
            fn(pm);
        } catch (err: any) {
            logs.push(`Script Error: ${err.message}`);
        }

        return { tests, logs, environmentUpdates };
    }
}
