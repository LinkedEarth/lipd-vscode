import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log('React version (webview):', React.version);

// Get the root element
const rootElement = document.getElementById('lipd-editor-root');

if (!rootElement) {
    throw new Error('Failed to find the root element');
}

// Render the app using React 18 root API
const root = createRoot(rootElement);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

// Hide the initial loading screen once React is mounted
// Add console.log statements to track initialization
console.log('Webview script loaded');