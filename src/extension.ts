import * as vscode from 'vscode';
import * as path from 'path';
import { LiPDEditorProvider } from './editor/lipdEditor';
import { LiPDFileHandler } from './lipdFileHandler';
import { Dataset, LiPD } from 'lipdjs';
import { Logger, LogLevel } from './utils/logger'

export function activate(context: vscode.ExtensionContext) {
    const lipdHandler = LiPDFileHandler.getInstance();

    // Initialize the logger
    const logger = Logger.getInstance();
    const outputChannel = vscode.window.createOutputChannel('LiPD');
    logger.initialize(outputChannel, LogLevel.INFO);
    logger.info('LiPD Extension activated');

    // Register LiPD Editor Provider
    context.subscriptions.push(LiPDEditorProvider.register(context, lipdHandler));

    // Register save command
    let saveCommand = vscode.commands.registerCommand('lipd-vscode.save', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        try {
            const document = editor.document;
            const data = JSON.parse(document.getText());
            const dataset = Dataset.fromJson(data);
            await lipdHandler.writeLiPDFile(document.uri.fsPath, dataset);
            vscode.window.showInformationMessage('File saved successfully');
            logger.info('LiPD file saved successfully: %s', document.uri.fsPath);
        } catch (error) {
            if (error instanceof Error) {
                vscode.window.showErrorMessage(`Failed to save file: ${error.message}`);
                logger.error('Failed to save file: %s', error.message);
            } else {
                vscode.window.showErrorMessage('Failed to save file: Unknown error');
                logger.error('Failed to save file: Unknown error');
            }
        }
    });

    // Register show output command
    let showOutputCommand = vscode.commands.registerCommand('lipd-vscode.showOutput', () => {
        logger.show();
    });

    // Register convert to RDF command
    let convertToRdfCommand = vscode.commands.registerCommand('lipd-vscode.convertToRDF', async () => {
        // Try to get LiPD file path from different sources
        let lipdFilePath: string | undefined;
        
        // First check active text editor
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && activeEditor.document.fileName.endsWith('.lpd')) {
            lipdFilePath = activeEditor.document.fileName;
        }
        
        // If not found, check if any LiPD file is open in custom editors
        if (!lipdFilePath) {
            // Get all open document editors
            const openEditors = vscode.window.visibleTextEditors;
            for (const editor of openEditors) {
                if (editor.document.fileName.endsWith('.lpd')) {
                    lipdFilePath = editor.document.fileName;
                    break;
                }
            }
        }
        
        // If still not found, check all open documents
        if (!lipdFilePath) {
            const openDocs = vscode.workspace.textDocuments;
            for (const doc of openDocs) {
                if (doc.fileName.endsWith('.lpd')) {
                    lipdFilePath = doc.fileName;
                    break;
                }
            }
        }
        
        // If still not found, check active custom editor
        if (!lipdFilePath) {
            // Get the active custom document
            for (const editor of vscode.window.visibleTextEditors) {
                // Check if this editor represents our custom editor
                if (editor.document.uri.scheme === 'lipd-vscode') {
                    // Get the original file path from the custom editor
                    lipdFilePath = editor.document.uri.fsPath;
                    break;
                }
            }
        }
        
        // If still not found, allow user to select a LiPD file
        if (!lipdFilePath) {
            const selectedFiles = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'LiPD Files': ['lpd']
                },
                title: 'Select LiPD File to Convert'
            });
            
            if (selectedFiles && selectedFiles.length > 0) {
                lipdFilePath = selectedFiles[0].fsPath;
            }
        }
        
        // If still no file path, show error
        if (!lipdFilePath) {
            vscode.window.showErrorMessage('No LiPD file found or selected. Please open a LiPD file first or select one to convert.');
            logger.error('No LiPD file found or selected for conversion');
            return;
        }
        
        // Ask for output format
        const formatOptions = [
            { label: 'Turtle (.ttl)', format: 'turtle', extension: '.ttl' },
            { label: 'JSON-LD (.jsonld)', format: 'json', extension: '.jsonld' },
            { label: 'N-Triples (.nt)', format: 'ntriples', extension: '.nt' },
            { label: 'RDF/XML (.rdf)', format: 'xml', extension: '.rdf' },
            { label: 'N3 (.n3)', format: 'n3', extension: '.n3' }
        ];
        
        const selectedFormat = await vscode.window.showQuickPick(formatOptions, {
            placeHolder: 'Select RDF output format',
            title: 'Convert LiPD to RDF'
        });
        
        if (!selectedFormat) {
            logger.info('User cancelled RDF format selection');
            return; // User cancelled
        }
        
        try {
            vscode.window.showInformationMessage(`Converting ${path.basename(lipdFilePath)} to ${selectedFormat.label}...`);
            logger.info('Starting conversion of %s to %s format', lipdFilePath, selectedFormat.format);
            
            // Create output path with the appropriate extension
            const outputPath = lipdFilePath.replace('.lpd', selectedFormat.extension);
            
            // Use lipdjs directly for conversion
            const lipd = new LiPD();
            await lipd.load(lipdFilePath);
            const serialized = await lipd.serialize(selectedFormat.format);
            
            // Write the serialized data to the output file
            const fs = require('fs');
            fs.writeFileSync(outputPath, serialized);
            
            logger.info('Conversion complete: %s -> %s', lipdFilePath, outputPath);
            vscode.window.showInformationMessage(`LiPD file converted to ${selectedFormat.label} and saved to ${outputPath}`);
            
            // Open the output file
            const doc = await vscode.workspace.openTextDocument(outputPath);
            await vscode.window.showTextDocument(doc);
        } catch (error) {
            if (error instanceof Error) {
                logger.error('Conversion failed: %s', error.message);
                vscode.window.showErrorMessage(`Failed to convert file to RDF: ${error.message}`);
            } else {
                logger.error('Conversion failed with unknown error');
                vscode.window.showErrorMessage('Failed to convert file to RDF: Unknown error');
            }
        }
    });

    // Add subscriptions
    context.subscriptions.push(saveCommand);
    context.subscriptions.push(showOutputCommand);
    context.subscriptions.push(convertToRdfCommand);
    
    logger.debug('LiPD Extension initialization complete');
}

export function deactivate() {
    Logger.getInstance().info('LiPD Extension deactivated');
} 