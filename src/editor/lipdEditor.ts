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
export type EditorInstance = {
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
    
    // Make static register method obsolete since we're creating the instance directly now
    public static register(context: vscode.ExtensionContext, lipdHandler: LiPDFileHandler): vscode.Disposable {
        // This is kept for backward compatibility only
        const provider = new LiPDEditorProvider(context, lipdHandler);
        return vscode.window.registerCustomEditorProvider('lipd-vscode.lipdEditor', provider, {
            webviewOptions: { retainContextWhenHidden: true },
            supportsMultipleEditorsPerDocument: false
        });
    }

    private _onDidChangeCustomDocument = new vscode.EventEmitter<vscode.CustomDocumentEditEvent<LiPDDocument>>();
    public readonly onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

    constructor(
        public readonly context: vscode.ExtensionContext,
        public readonly lipdHandler: LiPDFileHandler
    ) {}
    
    // Handle undo for the active editor
    public handleUndo() {
        const activeEditor = this.getActiveEditorInstance();
        if (activeEditor && activeEditor.document.canUndo()) {
            this.performUndo(activeEditor.document, activeEditor.webviewPanel);
        }
    }
    
    // Handle redo for the active editor
    public handleRedo() {
        const activeEditor = this.getActiveEditorInstance();
        if (activeEditor && activeEditor.document.canRedo()) {
            this.performRedo(activeEditor.document, activeEditor.webviewPanel);
        }
    }
    
    // Helper to find the active editor instance
    public getActiveEditorInstance(): EditorInstance | undefined {
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
        // Store the editor instance
        this.editorInstances.set(document.uri.toString(), { document, webviewPanel });
        
        // Handle panel close
        webviewPanel.onDidDispose(() => {
            this.editorInstances.delete(document.uri.toString());
        });
        
        // Set up the webview
        await this.setupWebview(document, webviewPanel);
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
            console.log('Saving document:', document.uri.toString());
            
            // Find the webview for this document
            let webviewPanel: vscode.WebviewPanel | undefined;
            for (const [_, instance] of this.editorInstances) {
                if (instance.document === document) {
                    webviewPanel = instance.webviewPanel;
                    break;
                }
            }
            
            if (!webviewPanel) {
                throw new Error('Could not find webview panel for document');
            }
            
            // For remote datasets, prompt for a save location
            if (document.uri.scheme === 'lipd-remote') {
                // Show save dialog to get destination
                const saveUri = await vscode.window.showSaveDialog({
                    defaultUri: vscode.Uri.file(document.uri.path),
                    filters: { 'LiPD Files': ['lpd'] }
                });
                
                if (!saveUri) {
                    // User cancelled the save dialog
                    return;
                }
                
                // Write the file
                await this.lipdHandler.writeLiPDFile(saveUri.fsPath, document.updated_dataset);
                console.log('Remote document saved successfully to:', saveUri.fsPath);
                
                // Notify the user
                vscode.window.showInformationMessage(`Dataset saved to ${saveUri.fsPath}`);
            } else {
                // For local files, save normally
            await this.lipdHandler.writeLiPDFile(document.uri.fsPath, document.updated_dataset);
                console.log('Document saved successfully');
            }
            
            // Notify webview of successful save
            webviewPanel.webview.postMessage({
                type: 'saveComplete',
                success: true
            });
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
            
            // Find the webview for this document
            let webviewPanel: vscode.WebviewPanel | undefined;
            for (const [_, instance] of this.editorInstances) {
                if (instance.document === document) {
                    webviewPanel = instance.webviewPanel;
                    break;
                }
            }
            
            if (!webviewPanel) {
                throw new Error('Could not find webview panel for document');
            }
            
            // For both remote and local documents, save to the specified destination
            await this.lipdHandler.writeLiPDFile(destination.fsPath, document.updated_dataset);
            console.log('Document saved successfully as:', destination.fsPath);
            
            // If this was a remote document, don't change its URI - it remains remote
            // VS Code will handle opening the newly saved file if needed
            
            // Notify webview of successful save
            webviewPanel.webview.postMessage({
                type: 'saveComplete',
                success: true
            });
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

    // Method to open a remote dataset directly from memory
    public async openRemoteDataset(dataset: Dataset | null, datasetName: string): Promise<vscode.WebviewPanel> {
        console.log(`Opening remote dataset: ${datasetName}`);
        
        // Create a virtual URI for this remote dataset
        const virtualUri = vscode.Uri.parse(`lipd-remote:/${datasetName}.lpd`);
        
        try {
            // Create a placeholder document with either the dataset or an empty one
            // If dataset is null (loading state), create a minimal empty dataset
            const emptyDataset = dataset || new Dataset();
            
            // If we're in loading state, ensure the dataset is properly empty
            if (!dataset) {
                // Strip properties that might trigger UI updates
                Object.keys(emptyDataset).forEach(key => {
                    if (key !== 'constructor' && typeof (emptyDataset as any)[key] !== 'function') {
                        delete (emptyDataset as any)[key];
                    }
                });
            }
            
            const document = new LiPDDocument(virtualUri, emptyDataset, emptyDataset);
            
            // Create a new webview panel
            const webviewPanel = vscode.window.createWebviewPanel(
                'lipd-vscode.lipdEditor',
                `${datasetName} (Remote)`,
                vscode.ViewColumn.Active,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [
                        vscode.Uri.joinPath(this.context.extensionUri, 'out'),
                        vscode.Uri.joinPath(this.context.extensionUri, 'media')
                    ]
                }
            );
            
            // Store the editor instance
            this.editorInstances.set(virtualUri.toString(), { document, webviewPanel });
            
            // Handle panel close
            webviewPanel.onDidDispose(() => {
                this.editorInstances.delete(virtualUri.toString());
            });
            
            // Set up the webview - this handles the initialization
            await this.setupWebview(document, webviewPanel);
            
            // If dataset is null, send a loading state message
            if (!dataset) {
                webviewPanel.webview.postMessage({
                    type: 'loading',
                    datasetName: datasetName,
                    message: 'Connecting to GraphDB and fetching dataset...'
                });
            }
            
            // Show the panel
            webviewPanel.reveal(vscode.ViewColumn.Active);
            
            return webviewPanel;
        } catch (error) {
            console.error(`Error opening remote dataset: ${error instanceof Error ? error.message : String(error)}`);
            vscode.window.showErrorMessage(`Failed to open remote dataset: ${datasetName}`);
            throw error;
        }
    }
    
    // Method to update a remote dataset when it's loaded
    public async updateRemoteDataset(webviewPanel: vscode.WebviewPanel, dataset: Dataset, datasetName: string): Promise<void> {
        try {
            // Find the document associated with this webview panel
            let document: LiPDDocument | undefined;
            
            for (const [_, instance] of this.editorInstances) {
                if (instance.webviewPanel === webviewPanel) {
                    document = instance.document;
                    break;
                }
            }
            
            if (!document) {
                throw new Error('Could not find document for webview panel');
            }
            
            // Update the document with the loaded dataset
            document.dataset = dataset;
            document.updated_dataset = dataset;
            
            // Send the dataset to the webview
            webviewPanel.webview.postMessage({
                type: 'init',
                data: dataset,
                canUndo: document.canUndo(),
                canRedo: document.canRedo(),
                isRemote: true,
                datasetName: datasetName
            });
        } catch (error) {
            console.error(`Error updating remote dataset: ${error instanceof Error ? error.message : String(error)}`);
            webviewPanel.webview.postMessage({
                type: 'error',
                error: `Failed to load dataset: ${error instanceof Error ? error.message : String(error)}`
            });
        }
    }
    
    // Setup the webview with necessary scripts and event handlers
    private async setupWebview(document: LiPDDocument, webviewPanel: vscode.WebviewPanel): Promise<void> {
        console.log('Setting up webview for document:', document.uri.toString());
        
        // Set up the webview options
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.context.extensionUri, 'out'),
                vscode.Uri.joinPath(this.context.extensionUri, 'media')
            ]
        };
        
        // Set the webview's HTML content
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
        
        // Store dataset for delayed initialization
        const isRemote = document.uri.scheme === 'lipd-remote';
        const datasetName = path.basename(document.uri.path, '.lpd');
        
        // Create a promise to track when the webview is ready
        let resolveWebviewReady: () => void;
        const webviewReady = new Promise<void>(resolve => {
            resolveWebviewReady = resolve;
        });
        
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
        
        // Handle messages from the webview
        webviewPanel.webview.onDidReceiveMessage(async (message: any) => {
            try {
                switch (message.type) {
                    case 'ready':
                        // Webview is ready, send initialization data
                        console.log('Webview is ready, sending initialization data');
                        
                        // First send theme
                        webviewPanel.webview.postMessage({
                            type: 'themeChanged',
                            theme: this.getCurrentTheme()
                        });
                        
                        // Check if we should send dataset data now
                        // For remote datasets that are loading, we'll skip sending the empty dataset
                        // The updateRemoteDataset method will send the actual data when it's loaded
                        const isEmptyRemote = isRemote && 
                                            (!document.updated_dataset || 
                                             Object.keys(document.updated_dataset).length === 0);
                        
                        if (!isEmptyRemote) {
                            // Then send the dataset initialization (only for non-loading remote datasets)
                            webviewPanel.webview.postMessage({
                                type: 'init',
                                data: document.updated_dataset,
                                canUndo: document.canUndo(),
                                canRedo: document.canRedo(),
                                isRemote: isRemote,
                                datasetName: datasetName
                            });
                        }
                        
                        // Resolve the ready promise
                        resolveWebviewReady();
                        break;
                        
                    case 'initError':
                        console.error('Webview initialization error:', message.error);
                        vscode.window.showErrorMessage(`Error initializing editor: ${message.error}`);
                        break;
                        
                    case 'initComplete':
                        console.log('Webview initialization complete');
                        break;
                        
                    case 'datasetUpdated':
                        console.log('Received updated dataset');
                        const updatedDataset = Dataset.fromDictionary(message.data); // Dataset object from webview
                        
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
                        break;
                        
                    case 'undo':
                        if (document.canUndo()) {
                            await this.performUndo(document, webviewPanel);
                        }
                        break;
                        
                    case 'redo':
                        if (document.canRedo()) {
                            await this.performRedo(document, webviewPanel);
                        }
                        break;
                        
                    case 'save':
                        try {
                            // Call saveCustomDocument directly instead of using the command
                            await this.saveCustomDocument(document);
                        } catch (error) {
                            console.error('Error saving document:', error);
                            webviewPanel.webview.postMessage({
                                type: 'saveComplete',
                                success: false,
                                error: error instanceof Error ? error.message : String(error)
                            });
                        }
                        break;
                        
                    case 'syncToGraphDB':
                        try {
                            console.log('Syncing document to GraphDB');
                            
                            // Get the GraphDB URL from settings
                            const graphDbUrl = vscode.workspace.getConfiguration('lipd').get('graphDbUrl') as string;
                            console.log('GraphDB URL:', graphDbUrl);

                            if (!graphDbUrl) {
                                throw new Error('GraphDB URL is not configured. Please set the lipd.graphDbUrl setting.');
                            }
                            
                            // Call the writeDatasetToGraphDB method on the lipdHandler with both dataset and URL
                            await this.lipdHandler.writeDatasetToGraphDB(document.updated_dataset, graphDbUrl);
                            console.log('Document synced successfully to GraphDB');
                            
                            // Notify webview of successful sync
                            webviewPanel.webview.postMessage({
                                type: 'syncComplete',
                                success: true,
                                syncCompleted: true
                            });
                            
                            // Notify the user
                            vscode.window.showInformationMessage(`Dataset synced to GraphDB successfully`);
                        } catch (error) {
                            console.error('Error syncing document to GraphDB:', error);
                            
                            // Notify webview of sync failure
                            webviewPanel.webview.postMessage({
                                type: 'syncComplete',
                                success: false,
                                syncCompleted: false,
                                error: error instanceof Error ? error.message : String(error)
                            });
                            
                            // Show error message
                            vscode.window.showErrorMessage(`Failed to sync dataset to GraphDB: ${error instanceof Error ? error.message : String(error)}`);
                        }
                        break;
                        
                    case 'executeCommand':
                        // Execute a VSCode command
                        console.log(`Executing VS Code command: ${message.command}`);
                        try {
                            // For Save command, call saveCustomDocument directly
                            if (message.command === 'workbench.action.files.save') {
                                await this.saveCustomDocument(document);
                            }
                            // For Save As command on remote datasets, use our custom method
                            else if (message.command === 'workbench.action.files.saveAs' && 
                                document.uri.scheme === 'lipd-remote') {
                                await this.saveRemoteDocument(document, webviewPanel);
                            } 
                            // For Save As on local documents, show save dialog and use saveCustomDocumentAs
                            else if (message.command === 'workbench.action.files.saveAs') {
                                const saveUri = await vscode.window.showSaveDialog({
                                    defaultUri: vscode.Uri.file(document.uri.fsPath),
                                    filters: { 'LiPD Files': ['lpd'] }
                                });
                                
                                if (saveUri) {
                                    await this.saveCustomDocumentAs(document, saveUri);
                                }
                            }
                            else {
                                await vscode.commands.executeCommand(message.command);
                            }
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
                        break;
                        
                    default:
                        console.log(`Unknown message type: ${message.type}`);
                }
            } catch (error) {
                console.error('Error handling webview message:', error);
                webviewPanel.webview.postMessage({
                    type: 'error',
                    error: `Error handling message: ${error instanceof Error ? error.message : String(error)}`
                });
            }
        });
    }

    // Method to save a remote dataset (not associated with a local file)
    async saveRemoteDocument(document: LiPDDocument, webviewPanel: vscode.WebviewPanel): Promise<void> {
        try {
            console.log('Saving remote document:', document.uri.toString());
            
            // Show save dialog to get destination
            const saveUri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(document.uri.path),
                filters: { 'LiPD Files': ['lpd'] }
            });
            
            if (!saveUri) {
                // User cancelled the save dialog
                return;
            }
            
            // Write the file
            await this.lipdHandler.writeLiPDFile(saveUri.fsPath, document.updated_dataset);
            console.log('Remote document saved successfully to:', saveUri.fsPath);
            
            // Notify the user
            vscode.window.showInformationMessage(`Dataset saved to ${saveUri.fsPath}`);
            
            // Notify webview of save success
            webviewPanel.webview.postMessage({
                type: 'saveComplete',
                success: true
            });
        } catch (error) {
            console.error('Error saving remote document:', error);
            
            // Show error message
            vscode.window.showErrorMessage(`Failed to save dataset: ${error instanceof Error ? error.message : String(error)}`);
            
            // Notify webview of save failure
            webviewPanel.webview.postMessage({
                type: 'saveComplete',
                success: false,
                error: error instanceof Error ? error.message : String(error)
            });
            
            // Re-throw error for caller handling
            if (error instanceof Error) {
                throw new Error(`Failed to save remote LiPD file: ${error.message}`);
            }
            throw new Error('Failed to save remote LiPD file: Unknown error');
        }
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