import * as vscode from 'vscode';
import { LiPDFileHandler } from '../lipdFileHandler';
import { Dataset } from 'lipdjs';
import * as path from 'path';
import * as fs from 'fs';

class LiPDDocument implements vscode.CustomDocument {
    constructor(
        public readonly uri: vscode.Uri
    ) { }

    dispose(): void {
        // Cleanup if needed
    }
}

export class LiPDEditorProvider implements vscode.CustomEditorProvider<LiPDDocument> {
    public static register(context: vscode.ExtensionContext, lipdHandler: LiPDFileHandler): vscode.Disposable {
        const provider = new LiPDEditorProvider(context, lipdHandler);
        const providerRegistration = vscode.window.registerCustomEditorProvider('lipd-vscode.lipdEditor', provider, {
            webviewOptions: {
                retainContextWhenHidden: true // Keep the webview state when hidden
            }
        });
        return providerRegistration;
    }

    private _onDidChangeCustomDocument = new vscode.EventEmitter<vscode.CustomDocumentEditEvent<LiPDDocument>>();
    public readonly onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly lipdHandler: LiPDFileHandler
    ) {}

    // Helper to get current theme
    private getCurrentTheme(): 'light' | 'dark' | 'high-contrast' {
        const colorTheme = vscode.window.activeColorTheme;
        if (colorTheme.kind === vscode.ColorThemeKind.Light) {
            return 'light';
        } else if (colorTheme.kind === vscode.ColorThemeKind.Dark) {
            return 'dark';
        } else {
            return 'high-contrast';
        }
    }

    async openCustomDocument(
        uri: vscode.Uri,
        _openContext: vscode.CustomDocumentOpenContext,
        _token: vscode.CancellationToken
    ): Promise<LiPDDocument> {
        const document = new LiPDDocument(uri);
        return document;
    }

    async resolveCustomEditor(
        document: LiPDDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        // Set up the webview options
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.context.extensionUri, 'media')
            ]
        };

        // Set up the HTML content for the webview
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

        // Watch for theme changes
        this.context.subscriptions.push(
            vscode.window.onDidChangeActiveColorTheme(theme => {
                let themeMode: 'light' | 'dark' | 'high-contrast';
                
                if (theme.kind === vscode.ColorThemeKind.Light) {
                    themeMode = 'light';
                } else if (theme.kind === vscode.ColorThemeKind.Dark) {
                    themeMode = 'dark';
                } else {
                    themeMode = 'high-contrast';
                }
                
                // Send the theme to the webview
                webviewPanel.webview.postMessage({ 
                    type: 'themeChanged', 
                    theme: themeMode 
                });
            })
        );

        // Set up message handling
        webviewPanel.webview.onDidReceiveMessage(async (message: any) => {
            console.log('Received message:', message);
            switch (message.type) {
                case 'ready':
                    try {
                        console.log('Loading LiPD file:', document.uri.fsPath);
                        const dataset = await this.lipdHandler.readLiPDFile(document.uri.fsPath);
                        
                        // Convert the dataset to a plain object for transmission
                        // The webview will convert it back to a Dataset instance
                        const serializedDataset = {
                            id: dataset.getId(),
                            data: JSON.stringify(dataset.toData())
                        };
                        
                        // Send the loaded dataset to the webview
                        webviewPanel.webview.postMessage({ 
                            type: 'datasetLoaded', 
                            data: serializedDataset
                        });
                        
                        // Send initial theme
                        webviewPanel.webview.postMessage({
                            type: 'themeChanged',
                            theme: this.getCurrentTheme()
                        });
                    } catch (error) {
                        if (error instanceof Error) {
                            const errorMessage = `Failed to load LiPD file: ${error.message}`;
                            vscode.window.showErrorMessage(errorMessage);
                            // Send error to the webview
                            webviewPanel.webview.postMessage({ 
                                type: 'error', 
                                error: errorMessage 
                            });
                        } else {
                            const errorMessage = 'Failed to load LiPD file: Unknown error';
                            vscode.window.showErrorMessage(errorMessage);
                            // Send error to the webview
                            webviewPanel.webview.postMessage({ 
                                type: 'error', 
                                error: errorMessage 
                            });
                        }
                    }
                    break;
                    
                case 'getTheme':
                    // Send current theme to webview
                    webviewPanel.webview.postMessage({
                        type: 'themeChanged',
                        theme: this.getCurrentTheme()
                    });
                    break;
                    
                case 'saveDataset':
                    try {
                        const dataset = Dataset.fromJson(message.data);
                        await this.lipdHandler.writeLiPDFile(document.uri.fsPath, dataset);
                        this._onDidChangeCustomDocument.fire({
                            document,
                            undo: () => Promise.resolve(),
                            redo: () => Promise.resolve()
                        });
                        
                        // Send save confirmation to the webview
                        webviewPanel.webview.postMessage({ 
                            type: 'saveComplete', 
                            success: true 
                        });
                        
                        vscode.window.showInformationMessage('LiPD file saved successfully');
                    } catch (error) {
                        let errorMessage: string;
                        if (error instanceof Error) {
                            errorMessage = `Failed to save LiPD file: ${error.message}`;
                        } else {
                            errorMessage = 'Failed to save LiPD file: Unknown error';
                        }
                        
                        // Send error to the webview
                        webviewPanel.webview.postMessage({ 
                            type: 'saveComplete', 
                            success: false,
                            error: errorMessage 
                        });
                        
                        vscode.window.showErrorMessage(errorMessage);
                    }
                    break;
                    
                case 'validateDataset':
                    try {
                        // You would implement validation here
                        // For now, just sending a mock response
                        webviewPanel.webview.postMessage({
                            type: 'validation',
                            results: {
                                errors: {},
                                warnings: {}
                            }
                        });
                    } catch (error) {
                        console.error('Validation error:', error);
                    }
                    break;
            }
        });
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        // Get the current theme
        const currentTheme = this.getCurrentTheme();

        // Get the local path to the editor HTML, and then read it
        const htmlPath = vscode.Uri.joinPath(this.context.extensionUri, 'media', 'editor.html');
        let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');

        // Create URIs for scripts and styles
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'editor.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'editor.css'));
        
        // Generate styles based on the current theme
        const themeStyles = `
        <style>
            :root {
                color-scheme: ${currentTheme === 'dark' || currentTheme === 'high-contrast' ? 'dark' : 'light'};
            }
            body {
                background-color: ${currentTheme === 'dark' ? '#1e1e1e' : 
                                  currentTheme === 'high-contrast' ? '#000000' : 
                                  '#ffffff'};
                color: ${currentTheme === 'dark' || currentTheme === 'high-contrast' ? '#cccccc' : '#333333'};
            }
            /* Initial loader styles */
            #lipd-editor-root {
                transition: background-color 0.2s ease;
            }
        </style>
        `;
        
        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();

        // Replace placeholders in the HTML content
        htmlContent = htmlContent.replace(/{{scriptUri}}/g, scriptUri.toString());
        htmlContent = htmlContent.replace(/{{cssUri}}/g, styleUri.toString());
        htmlContent = htmlContent.replace(/{{cspSource}}/g, webview.cspSource);
        htmlContent = htmlContent.replace(/{{nonce}}/g, nonce);
        htmlContent = htmlContent.replace('</head>', `${themeStyles}\n    <script nonce="${nonce}">
            // Initialize theme data for the React app to use immediately
            window.initialTheme = "${currentTheme}";
        </script>\n</head>`);

        return htmlContent;
    }

    async saveCustomDocument(document: LiPDDocument): Promise<void> {
        // This method is called when the editor is saving the document
        // It's handled by our message handler when the user clicks save in the UI
    }

    async saveCustomDocumentAs(document: LiPDDocument, destination: vscode.Uri): Promise<void> {
        try {
            const dataset = await this.lipdHandler.readLiPDFile(document.uri.fsPath);
            await this.lipdHandler.writeLiPDFile(destination.fsPath, dataset);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to save LiPD file: ${error.message}`);
            }
            throw new Error('Failed to save LiPD file: Unknown error');
        }
    }

    async revertCustomDocument(document: LiPDDocument): Promise<void> {
        // Called when the user discards changes
        // We can reload the original file
    }

    async backupCustomDocument(
        document: LiPDDocument,
        context: vscode.CustomDocumentBackupContext
    ): Promise<vscode.CustomDocumentBackup> {
        // We don't need special backup handling for now
        return {
            id: context.destination.toString(),
            delete: () => { /* No special deletion needed */ }
        };
    }

    public dispose() {
        // Clean up any resources
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
} 