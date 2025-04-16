import * as vscode from 'vscode';
import { LiPDFileHandler } from '../lipdFileHandler';
import { Dataset } from 'lipdjs';
import * as path from 'path';
import * as fs from 'fs';
// import { LiPD } from 'lipdjs';

// Interface for an edit operation
interface Edit {
    dataset: Dataset;
    label: string;
    timestamp: number;
}

// Track active editors and documents
type EditorInstance = {
    document: LiPDDocument;
    webviewPanel: vscode.WebviewPanel;
};

class LiPDDocument implements vscode.CustomDocument {
    // Edit history for undo/redo
    private undoStack: Edit[] = [];
    private redoStack: Edit[] = [];
    
    constructor(
        public readonly uri: vscode.Uri,
        public dataset: Dataset,
        public updated_dataset: Dataset
    ) { }

    // Apply an edit to the document
    async makeEdit(edit: Dataset, label: string): Promise<void> {
        // Add the current state to the undo stack before applying the edit
        this.undoStack.push({
            dataset: this.updated_dataset,
            label: label || 'Edit',
            timestamp: Date.now()
        });
        
        // Clear the redo stack on new edits
        this.redoStack = [];
        
        // Update to the new state
        this.updated_dataset = edit;
    }
    
    // Undo the last edit
    async undo(): Promise<Dataset | undefined> {
        const lastEdit = this.undoStack.pop();
        if (!lastEdit) {
            return undefined; // Nothing to undo
        }
        
        // Save current state to redo stack
        this.redoStack.push({
            dataset: this.updated_dataset,
            label: lastEdit.label,
            timestamp: Date.now()
        });
        
        // Revert to the previous state
        this.updated_dataset = lastEdit.dataset;
        return this.updated_dataset;
    }
    
    // Redo the last undone edit
    async redo(): Promise<Dataset | undefined> {
        const nextEdit = this.redoStack.pop();
        if (!nextEdit) {
            return undefined; // Nothing to redo
        }
        
        // Save current state to undo stack
        this.undoStack.push({
            dataset: this.updated_dataset,
            label: nextEdit.label,
            timestamp: Date.now()
        });
        
        // Apply the redone edit
        this.updated_dataset = nextEdit.dataset;
        return this.updated_dataset;
    }
    
    // Check if we can undo
    canUndo(): boolean {
        return this.undoStack.length > 0;
    }
    
    // Check if we can redo
    canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    dispose(): void {
        // Cleanup if needed
    }
}

export class LiPDEditorProvider implements vscode.CustomEditorProvider<LiPDDocument> {
    // Track all open editor instances
    private editorInstances: Map<string, EditorInstance> = new Map();
    
    public static register(context: vscode.ExtensionContext, lipdHandler: LiPDFileHandler): vscode.Disposable {
        const provider = new LiPDEditorProvider(context, lipdHandler);
        
        // Register the editor provider
        const providerRegistration = vscode.window.registerCustomEditorProvider('lipd-vscode.lipdEditor', provider, {
            webviewOptions: {
                retainContextWhenHidden: true
            },
            supportsMultipleEditorsPerDocument: false
        });
        
        // Register the global undo/redo commands that delegate to the active editor
        const undoRegistration = vscode.commands.registerCommand('lipd-vscode.undo', () => {
            provider.handleUndo();
        });
        
        const redoRegistration = vscode.commands.registerCommand('lipd-vscode.redo', () => {
            provider.handleRedo();
        });
        
        return vscode.Disposable.from(providerRegistration, undoRegistration, redoRegistration);
    }

    private _onDidChangeCustomDocument = new vscode.EventEmitter<vscode.CustomDocumentEditEvent<LiPDDocument>>();
    public readonly onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly lipdHandler: LiPDFileHandler
    ) {}
    
    // Handle undo for the active editor
    private handleUndo() {
        const activeEditor = this.getActiveEditorInstance();
        if (activeEditor && activeEditor.document.canUndo()) {
            this.performUndo(activeEditor.document, activeEditor.webviewPanel);
        }
    }
    
    // Handle redo for the active editor
    private handleRedo() {
        const activeEditor = this.getActiveEditorInstance();
        if (activeEditor && activeEditor.document.canRedo()) {
            this.performRedo(activeEditor.document, activeEditor.webviewPanel);
        }
    }
    
    // Helper to find the active editor instance
    private getActiveEditorInstance(): EditorInstance | undefined {
        // Find the active editor
        for (const [_, instance] of this.editorInstances) {
            if (instance.webviewPanel.active) {
                return instance;
            }
        }
        return undefined;
    }
    
    // Perform undo operation
    private async performUndo(document: LiPDDocument, webviewPanel: vscode.WebviewPanel) {
        const previousDataset = await document.undo();
        if (previousDataset) {
            // Notify the webview of the undo
            webviewPanel.webview.postMessage({
                type: 'datasetChanged',
                data: previousDataset,
                source: 'undo'
            });
            
            // Update the undo/redo state
            webviewPanel.webview.postMessage({
                type: 'undoRedoStateChanged',
                canUndo: document.canUndo(),
                canRedo: document.canRedo()
            });
        }
    }
    
    // Perform redo operation
    private async performRedo(document: LiPDDocument, webviewPanel: vscode.WebviewPanel) {
        const nextDataset = await document.redo();
        if (nextDataset) {
            // Notify the webview of the redo
            webviewPanel.webview.postMessage({
                type: 'datasetChanged',
                data: nextDataset,
                source: 'redo'
            });
            
            // Update the undo/redo state
            webviewPanel.webview.postMessage({
                type: 'undoRedoStateChanged',
                canUndo: document.canUndo(),
                canRedo: document.canRedo()
            });
        }
    }

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
        try {
            // Create a new LiPD instance for each file to avoid collisions
            const dataset = await this.lipdHandler.readLiPDFile(uri.fsPath);
            if (!dataset) {
                throw new Error('Failed to load dataset from file: Dataset is undefined');
            }
            const document = new LiPDDocument(uri, dataset, dataset);
            return document;
        } catch (error) {
            // Log and show the error to the user
            console.error('Error opening LiPD file:', error);
            vscode.window.showErrorMessage(`Error opening LiPD file: ${error instanceof Error ? error.message : String(error)}`);
            
            // Re-throw the error to prevent VS Code from proceeding with an invalid document
            throw error;
        }
    }

    async resolveCustomEditor(
        document: LiPDDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        // Store this editor instance
        const editorKey = document.uri.toString();
        this.editorInstances.set(editorKey, { document, webviewPanel });
        
        // Clean up when this editor is closed
        webviewPanel.onDidDispose(() => {
            this.editorInstances.delete(editorKey);
        });
        
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
                const updatedDataset = Dataset.fromDictionary(message.data);
                
                // Apply the edit and track it in the history
                await document.makeEdit(updatedDataset, message.label || 'Edit');
                
                // Fire the document change event to show the modification indicator (dot)
                this._onDidChangeCustomDocument.fire({
                    document,
                    undo: async () => {
                        await this.performUndo(document, webviewPanel);
                    },
                    redo: async () => {
                        await this.performRedo(document, webviewPanel);
                    }
                });
                
                // Update the undo/redo state in the webview
                webviewPanel.webview.postMessage({
                    type: 'undoRedoStateChanged',
                    canUndo: document.canUndo(),
                    canRedo: document.canRedo()
                });
            }
            else if (message.type === 'undo') {
                if (document.canUndo()) {
                    await this.performUndo(document, webviewPanel);
                }
            }
            else if (message.type === 'redo') {
                if (document.canRedo()) {
                    await this.performRedo(document, webviewPanel);
                }
            }
            else if (message.type === 'executeCommand') {
                // Execute a VSCode command
                console.log(`Executing VS Code command: ${message.command}`);
                try {
                    await vscode.commands.executeCommand(message.command);
                } catch (error) {
                    console.error(`Error executing VS Code command ${message.command}:`, error);
                    webviewPanel.webview.postMessage({
                        type: 'error',
                        error: `Failed to execute command: ${error instanceof Error ? error.message : String(error)}`
                    });
                    
                    if (message.command === 'workbench.action.files.save' || 
                        message.command === 'workbench.action.files.saveAs') {
                        // Notify webview of save failure
                        webviewPanel.webview.postMessage({
                            type: 'saveComplete',
                            success: false,
                            error: error instanceof Error ? error.message : String(error)
                        });
                    }
                }
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
        try {
            console.log('Saving document:', document.uri.fsPath);
            
            await this.lipdHandler.writeLiPDFile(document.uri.fsPath, document.updated_dataset);
            console.log('Document saved successfully');
            
            // Find the webview and notify it of successful save
            for (const [_, instance] of this.editorInstances) {
                if (instance.document === document) {
                    instance.webviewPanel.webview.postMessage({
                        type: 'saveComplete',
                        success: true
                    });
                    break;
                }
            }
        } catch (error) {
            console.error('Error saving document:', error);
            
            // Find the webview and notify it of save failure
            for (const [_, instance] of this.editorInstances) {
                if (instance.document === document) {
                    instance.webviewPanel.webview.postMessage({
                        type: 'saveComplete',
                        success: false,
                        error: error instanceof Error ? error.message : String(error)
                    });
                    break;
                }
            }
            
            if (error instanceof Error) {
                throw new Error(`Failed to save LiPD file: ${error.message}`);
            }
            throw new Error('Failed to save LiPD file: Unknown error');
        }
    }

    async saveCustomDocumentAs(document: LiPDDocument, destination: vscode.Uri): Promise<void> {
        try {
            console.log('Saving document as:', destination.fsPath);
            
            await this.lipdHandler.writeLiPDFile(destination.fsPath, document.updated_dataset);
            console.log('Document saved successfully as:', destination.fsPath);
            
            // Find the webview and notify it of successful save
            for (const [_, instance] of this.editorInstances) {
                if (instance.document === document) {
                    instance.webviewPanel.webview.postMessage({
                        type: 'saveComplete',
                        success: true
                    });
                    break;
                }
            }
        } catch (error) {
            console.error('Error saving document as:', error);
            
            // Find the webview and notify it of save failure
            for (const [_, instance] of this.editorInstances) {
                if (instance.document === document) {
                    instance.webviewPanel.webview.postMessage({
                        type: 'saveComplete',
                        success: false,
                        error: error instanceof Error ? error.message : String(error)
                    });
                    break;
                }
            }
            
            if (error instanceof Error) {
                throw new Error(`Failed to save LiPD file: ${error.message}`);
            }
            throw new Error('Failed to save LiPD file: Unknown error');
        }
    }

    async revertCustomDocument(document: LiPDDocument): Promise<void> {
        try {
            // Reload the original document
            const dataset = await this.lipdHandler.readLiPDFile(document.uri.fsPath);
            if (!dataset) {
                throw new Error('Failed to revert document: Dataset is undefined');
            }
            // Update the document with the reloaded data
            document.updated_dataset = dataset;
            // Find and update the webview if it exists
            for (const [key, instance] of this.editorInstances) {
                if (instance.document === document) {
                    instance.webviewPanel.webview.postMessage({
                        type: 'datasetChanged',
                        data: document.updated_dataset,
                        source: 'revert'
                    });
                    break;
                }
            }
        } catch (error) {
            console.error('Error reverting document:', error);
            throw new Error(`Failed to revert document: ${error instanceof Error ? error.message : String(error)}`);
        }
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
        // Clear the editor instances map
        this.editorInstances.clear();
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