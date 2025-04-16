import * as vscode from 'vscode';
import { LiPDEditorProvider } from './editor/lipdEditor';
import { LiPDFileHandler } from './lipdFileHandler';
import { Logger, LogLevel } from './utils/logger'

export function activate(context: vscode.ExtensionContext) {
    // Initialize the logger
    const logger = Logger.getInstance();
    const outputChannel = vscode.window.createOutputChannel('LiPD');
    logger.initialize(outputChannel, LogLevel.INFO);
    logger.info('LiPD Extension activated');

    // Register LiPD Editor Provider
    context.subscriptions.push(LiPDEditorProvider.register(context, LiPDFileHandler.getInstance()));
    
    logger.debug('LiPD Extension initialization complete');
}

export function deactivate() {
    Logger.getInstance().info('LiPD Extension deactivated');
} 