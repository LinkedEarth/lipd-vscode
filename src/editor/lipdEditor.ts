import * as vscode from 'vscode';
import { LiPDFileHandler } from '../lipdFileHandler';
import { Dataset } from 'lipdjs';
import * as path from 'path';
import * as fs from 'fs';

class LiPDDocument implements vscode.CustomDocument {
    constructor(
        public readonly uri: vscode.Uri,
        public dataset: Dataset,
        public updated_dataset: Dataset
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
        console.log('Opening document:', uri.fsPath);
        const dataset = await this.lipdHandler.readLiPDFile(uri.fsPath);
        const document = new LiPDDocument(uri, dataset, dataset);
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

        // Message handlers
        webviewPanel.webview.onDidReceiveMessage(async (message: any) => {
            if (message.type === 'ready') {
                console.log('Webview is ready, sending dataset');
                try {                    
                    // Send the dataset to the webview
                    webviewPanel.webview.postMessage({ 
                        type: 'datasetLoaded', 
                        data: document.dataset
                    });

                    // Send the theme to the webview
                    webviewPanel.webview.postMessage({
                        type: 'themeChanged',
                        theme: this.getCurrentTheme()
                    });

                } catch (error) {
                    console.error('Error serializing dataset:', error);
                    webviewPanel.webview.postMessage({ 
                        type: 'error', 
                        error: 'Failed to load dataset' 
                    });
                }
            }
            else if (message.type === 'datasetUpdated') {
                console.log('Received updated dataset');
                document.updated_dataset = Dataset.fromDictionary(message.data);
                
                // Fire the document change event to show the modification indicator (dot)
                this._onDidChangeCustomDocument.fire({
                    document,
                    undo: () => Promise.resolve(),
                    redo: () => Promise.resolve()
                });
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
        try {
            console.log('Saving document:', document.uri.fsPath);
            await this.lipdHandler.writeLiPDFile(document.uri.fsPath, document.updated_dataset);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to save LiPD file: ${error.message}`);
            }
            throw new Error('Failed to save LiPD file: Unknown error');
        }
    }

    async saveCustomDocumentAs(document: LiPDDocument, destination: vscode.Uri): Promise<void> {
        try {
            console.log('Saving document as :', destination.fsPath);
            await this.lipdHandler.writeLiPDFile(destination.fsPath, document.updated_dataset);
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