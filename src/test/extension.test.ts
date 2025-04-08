import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

// suite('Extension Test Suite', () => {
//     vscode.window.showInformationMessage('Start all tests.');

//     test('Extension should be present', () => {
//         assert.ok(vscode.extensions.getExtension('lipd-vscode'));
//     });

//     test('Should activate', async () => {
//         const ext = vscode.extensions.getExtension('lipd-vscode');
//         await ext?.activate();
//     });

//     test('Should register commands', async () => {
//         const commands = await vscode.commands.getCommands();
//         assert.ok(commands.includes('lipd-vscode.openLiPD'));
//         assert.ok(commands.includes('lipd-vscode.saveLiPD'));
//     });
// }); 