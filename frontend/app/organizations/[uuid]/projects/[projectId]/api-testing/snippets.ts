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
        content: 'ct.environment.set("variable_key", "variable_value");',
        type: 'pre-request',
    },
    {
        id: 'get-env-var',
        name: 'Get an environment variable',
        description: 'Get the value of an environment variable',
        content: 'const value = ct.environment.get("variable_key");',
        type: 'pre-request',
    },
    {
        id: 'clear-env-var',
        name: 'Clear an environment variable',
        description: 'Remove an environment variable',
        content: 'ct.environment.unset("variable_key");',
        type: 'pre-request',
    },
    {
        id: 'send-request',
        name: 'Send a request',
        description: 'Send an asynchronous HTTP request',
        content: `ct.sendRequest("https://postman-echo.com/get", (err, response) => {
    console.log(response.json());
});`,
        type: 'pre-request',
    },

    // Post-request / Test Script Snippets
    {
        id: 'status-200',
        name: 'Status code: Code is 200',
        description: 'Check if the response status code is 200',
        content: `ct.test("Status code is 200", () => {
    ct.response.to.have.status(200);
});`,
        type: 'post-request',
    },
    {
        id: 'response-body-json',
        name: 'Response body: JSON value check',
        description: 'Check a value in the JSON response body',
        content: `ct.test("Your test name", () => {
    const jsonData = ct.response.json();
    ct.expect(jsonData.value).to.eql(100);
});`,
        type: 'post-request',
    },
    {
        id: 'response-time',
        name: 'Response time is less than 200ms',
        description: 'Check if the response time is within limits',
        content: `ct.test("Response time is less than 200ms", () => {
    ct.expect(ct.response.responseTime).to.be.below(200);
});`,
        type: 'post-request',
    },
    {
        id: 'status-is-one-of',
        name: 'Status code: Successful POST request',
        description: 'Check if the status code is 201 or 202',
        content: `ct.test("Successful POST request", () => {
    ct.expect(ct.response.code).to.be.oneOf([201, 202]);
});`,
        type: 'post-request',
    },
    {
        id: 'header-exists',
        name: 'Response headers: Content-Type check',
        description: 'Check if a header exists in the response',
        content: `ct.test("Content-Type is present", () => {
    ct.response.to.have.header("Content-Type");
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
