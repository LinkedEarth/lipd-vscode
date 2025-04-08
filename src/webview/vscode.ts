// Get VS Code API
declare const acquireVsCodeApi: () => {
    postMessage: (message: any) => void;
    getState: () => any;
    setState: (state: any) => void;
};

// Create a singleton instance of the VS Code API
let vscodeApi: ReturnType<typeof acquireVsCodeApi>;

export function getVSCodeAPI() {
    if (!vscodeApi) {
        vscodeApi = acquireVsCodeApi();
    }
    return vscodeApi;
} 