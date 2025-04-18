import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

// Get the root element
const rootElement = document.getElementById('lipd-editor-root');

if (!rootElement) {
    throw new Error('Failed to find the root element');
}

// Render the app
ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    rootElement
);

// Add console.log statements to track initialization
console.log('Webview script loaded');