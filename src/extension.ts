import * as vscode from 'vscode';
import { LiPDEditorProvider } from './editor/lipdEditor';
import { LiPDFileHandler } from './lipdFileHandler';
import { Logger, LogLevel } from './utils/logger'
import { LiPDExplorerProvider } from './explorer/lipdExplorer';
import { Dataset } from 'lipdjs';

// Store a reference to the editor provider instance
let editorProviderInstance: LiPDEditorProvider;

export function activate(context: vscode.ExtensionContext) {
    // Initialize the logger
    const logger = Logger.getInstance();
    const outputChannel = vscode.window.createOutputChannel('LiPD');
    logger.initialize(outputChannel, LogLevel.INFO);
    logger.info('LiPD Extension activated');

    // Get the LiPD file handler instance
    const lipdHandler = LiPDFileHandler.getInstance();

    // Create the editor provider
    editorProviderInstance = new LiPDEditorProvider(context, lipdHandler);
    
    // Register LiPD Editor Provider
    const editorRegistration = vscode.window.registerCustomEditorProvider(
        'lipd-vscode.lipdEditor', 
        editorProviderInstance, 
        {
            webviewOptions: { retainContextWhenHidden: true },
            supportsMultipleEditorsPerDocument: false
        }
    );
    context.subscriptions.push(editorRegistration);
    
    // Register undo/redo commands
    const undoCommand = vscode.commands.registerCommand('lipd-vscode.undo', () => {
        if (editorProviderInstance) {
            editorProviderInstance.handleUndo();
        }
    });
    context.subscriptions.push(undoCommand);
    
    const redoCommand = vscode.commands.registerCommand('lipd-vscode.redo', () => {
        if (editorProviderInstance) {
            editorProviderInstance.handleRedo();
        }
    });
    context.subscriptions.push(redoCommand);
    
    // Register LiPD Explorer Provider
    context.subscriptions.push(LiPDExplorerProvider.register(context, lipdHandler));
    
    // Register command to open remote datasets in the editor
    const openRemoteCommand = vscode.commands.registerCommand(
        'lipd-vscode.openRemoteDatasetInEditor',
        async (dataset: Dataset | null, datasetName: string) => {
            logger.info(`Handling command to open remote dataset: ${datasetName}`);
            
            try {
                if (editorProviderInstance && editorProviderInstance.openRemoteDataset) {
                    // Use the instance we stored at the top level
                    return await editorProviderInstance.openRemoteDataset(dataset, datasetName);
                } else {
                    throw new Error('Editor provider or openRemoteDataset method not available');
                }
            } catch (error) {
                logger.error('Error opening remote dataset:', error);
                vscode.window.showErrorMessage('Failed to open remote dataset: ' + 
                    (error instanceof Error ? error.message : String(error)));
                throw error;
            }
        }
    );
    context.subscriptions.push(openRemoteCommand);
    
    // Register command to update an already open remote dataset
    const updateRemoteCommand = vscode.commands.registerCommand(
        'lipd-vscode.updateRemoteDatasetInEditor',
        async (webviewPanel: vscode.WebviewPanel, dataset: Dataset, datasetName: string) => {
            logger.info(`Handling command to update remote dataset: ${datasetName}`);
            
            try {
                if (editorProviderInstance && editorProviderInstance.updateRemoteDataset) {
                    await editorProviderInstance.updateRemoteDataset(webviewPanel, dataset, datasetName);
                } else {
                    throw new Error('Editor provider or updateRemoteDataset method not available');
                }
            } catch (error) {
                logger.error('Error updating remote dataset:', error);
                vscode.window.showErrorMessage('Failed to update remote dataset: ' + 
                    (error instanceof Error ? error.message : String(error)));
            }
        }
    );
    context.subscriptions.push(updateRemoteCommand);
    
    // Register a debug command to check the editor provider status
    const debugCommand = vscode.commands.registerCommand(
        'lipd-vscode.debugEditorProvider',
        () => {
            const hasInstance = !!editorProviderInstance;
            const hasMethod = hasInstance && typeof editorProviderInstance.openRemoteDataset === 'function';
            
            logger.info(`EditorProvider debug: hasInstance=${hasInstance}, hasMethod=${hasMethod}`);
            
            vscode.window.showInformationMessage(
                `Editor Provider Debug:\n` +
                `- Provider instance: ${hasInstance ? 'Available' : 'Not available'}\n` +
                `- openRemoteDataset method: ${hasMethod ? 'Available' : 'Not available'}`
            );
        }
    );
    context.subscriptions.push(debugCommand);
    
    logger.debug('LiPD Extension initialization complete');
}

export function deactivate() {
    Logger.getInstance().info('LiPD Extension deactivated');
} 