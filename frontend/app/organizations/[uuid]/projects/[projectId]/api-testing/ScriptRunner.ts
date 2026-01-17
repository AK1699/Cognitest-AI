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

export interface ScriptContext {
    response?: {
        status: number;
        statusText: string;
        time: number;
        size: number;
        headers: Record<string, string>;
        body: any;
        cookies?: Record<string, string>;
    };
    environment: Record<string, string>;
}

export class ScriptRunner {
    static execute(script: string, context: ScriptContext): ScriptExecutionResult {
        const tests: TestResult[] = [];
        const logs: string[] = [];
        const environmentUpdates: Record<string, string> = { ...context.environment };

        // Helper to log messages from scripts
        const log = (...args: any[]) => {
            const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ');
            logs.push(message);
        };

        const ct = {
            log: log,
            test: (name: string, callback: () => void) => {
                try {
                    callback();
                    tests.push({ name, passed: true });
                } catch (err: any) {
                    tests.push({ name, passed: false, error: err.message });
                }
            },
            expect: (value: any) => {
                const expectObj: any = {
                    to: {
                        be: {
                            a: (type: string) => {
                                if (typeof value !== type) throw new Error(`Expected ${value} to be a ${type}`);
                                return expectObj.to;
                            },
                            ok: () => {
                                if (!value) throw new Error(`Expected ${value} to be truthy`);
                                return expectObj.to;
                            },
                            oneOf: (arr: any[]) => {
                                if (!arr.includes(value)) throw new Error(`Expected ${value} to be one of ${JSON.stringify(arr)}`);
                                return expectObj.to;
                            }
                        },
                        eql: (other: any) => {
                            if (JSON.stringify(value) !== JSON.stringify(other)) {
                                throw new Error(`Expected ${JSON.stringify(value)} to equal ${JSON.stringify(other)}`);
                            }
                            return expectObj.to;
                        },
                        have: {
                            property: (prop: string) => {
                                if (!value || typeof value !== 'object' || !(prop in value)) {
                                    throw new Error(`Expected object to have property "${prop}"`);
                                }
                                return expectObj.to;
                            },
                            status: (status: number) => {
                                if (context.response?.status !== status) {
                                    throw new Error(`Expected status ${status} but got ${context.response?.status}`);
                                }
                                return expectObj.to;
                            },
                            jsonSchema: (schema: any) => {
                                // Simple schema validation - check for required keys
                                if (schema.required && Array.isArray(schema.required)) {
                                    schema.required.forEach((key: string) => {
                                        if (!(key in value)) throw new Error(`Schema validation failed: Missing required property "${key}"`);
                                    });
                                }
                                return expectObj.to;
                            }
                        },
                        not: {
                            eql: (other: any) => {
                                if (JSON.stringify(value) === JSON.stringify(other)) {
                                    throw new Error(`Expected ${JSON.stringify(value)} to not equal ${JSON.stringify(other)}`);
                                }
                                return expectObj.to;
                            }
                        }
                    }
                };
                return expectObj;
            },
            response: {
                status: context.response?.status,
                headers: context.response?.headers,
                responseTime: context.response?.time,
                json: () => context.response?.body,
                text: () => typeof context.response?.body === 'string' ? context.response.body : JSON.stringify(context.response?.body),
                to: {
                    have: {
                        status: (status: number) => {
                            if (context.response?.status !== status) {
                                throw new Error(`Expected status ${status} but got ${context.response?.status}`);
                            }
                        },
                        header: (key: string, value?: string) => {
                            const headers = context.response?.headers || {};
                            const actualValue = headers[key] || headers[key.toLowerCase()];
                            if (actualValue === undefined) throw new Error(`Expected header "${key}" to be present`);
                            if (value !== undefined && actualValue !== value) {
                                throw new Error(`Expected header "${key}" to be "${value}" but got "${actualValue}"`);
                            }
                        }
                    },
                    be: {
                        json: () => {
                            if (typeof context.response?.body !== 'object') throw new Error('Expected response body to be JSON');
                        },
                        success: () => {
                            if (!context.response?.status || context.response.status >= 400) {
                                throw new Error(`Expected success status but got ${context.response?.status}`);
                            }
                        }
                    }
                }
            },
            environment: {
                get: (key: string) => environmentUpdates[key],
                set: (key: string, value: string) => {
                    environmentUpdates[key] = value;
                },
                unset: (key: string) => {
                    delete environmentUpdates[key];
                }
            }
        };

        try {
            // Execute script within the context of 'ct'
            const fn = new Function('ct', 'console', script);
            // We pass our log as both ct.log and console.log for the script context
            fn(ct, { log: log });
        } catch (err: any) {
            logs.push(`Script Error: ${err.message}`);
        }

        return { tests, logs, environmentUpdates };
    }
}
