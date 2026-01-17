export interface Snippet {
    id: string;
    name: string;
    description: string;
    content: string;
    type: 'pre-request' | 'post-request' | 'body';
}

export const SNIPPETS: Snippet[] = [
    // Pre-request Script Snippets
    {
        id: 'set-env-var',
        name: 'Set an environment variable',
        description: 'Set a value for an environment variable',
        content: 'pm.environment.set("variable_key", "variable_value");',
        type: 'pre-request',
    },
    {
        id: 'get-env-var',
        name: 'Get an environment variable',
        description: 'Get the value of an environment variable',
        content: 'const value = pm.environment.get("variable_key");',
        type: 'pre-request',
    },
    {
        id: 'clear-env-var',
        name: 'Clear an environment variable',
        description: 'Remove an environment variable',
        content: 'pm.environment.unset("variable_key");',
        type: 'pre-request',
    },
    {
        id: 'send-request',
        name: 'Send a request',
        description: 'Send an asynchronous HTTP request',
        content: `pm.sendRequest("https://postman-echo.com/get", (err, response) => {
    console.log(response.json());
});`,
        type: 'pre-request',
    },

    // Post-request / Test Script Snippets
    {
        id: 'status-200',
        name: 'Status code: Code is 200',
        description: 'Check if the response status code is 200',
        content: `pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
});`,
        type: 'post-request',
    },
    {
        id: 'response-body-json',
        name: 'Response body: JSON value check',
        description: 'Check a value in the JSON response body',
        content: `pm.test("Your test name", () => {
    const jsonData = pm.response.json();
    pm.expect(jsonData.value).to.eql(100);
});`,
        type: 'post-request',
    },
    {
        id: 'response-time',
        name: 'Response time is less than 200ms',
        description: 'Check if the response time is within limits',
        content: `pm.test("Response time is less than 200ms", () => {
    pm.expect(pm.response.responseTime).to.be.below(200);
});`,
        type: 'post-request',
    },
    {
        id: 'status-is-one-of',
        name: 'Status code: Successful POST request',
        description: 'Check if the status code is 201 or 202',
        content: `pm.test("Successful POST request", () => {
    pm.expect(pm.response.code).to.be.oneOf([201, 202]);
});`,
        type: 'post-request',
    },
    {
        id: 'header-exists',
        name: 'Response headers: Content-Type check',
        description: 'Check if a header exists in the response',
        content: `pm.test("Content-Type is present", () => {
    pm.response.to.have.header("Content-Type");
});`,
        type: 'post-request',
    },

    // Body Snippets
    {
        id: 'json-object',
        name: 'JSON Object',
        description: 'Standard JSON object template',
        content: '{\n  "key": "value"\n}',
        type: 'body',
    },
    {
        id: 'json-array',
        name: 'JSON Array',
        description: 'Standard JSON array template',
        content: '[\n  {\n    "id": 1,\n    "name": "Item 1"\n  }\n]',
        type: 'body',
    },
];
