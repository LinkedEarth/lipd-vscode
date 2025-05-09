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
        try {
            console.log('Acquiring VS Code API...');
            vscodeApi = acquireVsCodeApi();
            vscodeApi.postMessage({ type: 'ready' });
        } catch (error) {
            console.error('Failed to acquire VS Code API:', error);
        }
    }
    return vscodeApi;
}

// Helper to send messages to VS Code
export function postMessage(message: any) {
    try {
        const api = getVSCodeAPI();
        if (api) {
            console.log('Posting message to VS Code:', message.type);
            api.postMessage(message);
        } else {
            console.error('Cannot post message, VS Code API is not available');
        }
    } catch (error) {
        console.error('Error posting message to VS Code:', error);
    }
} 