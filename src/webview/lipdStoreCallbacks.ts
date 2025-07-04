import { Dataset } from 'lipdjs';
import { LiPDStoreCallbacks } from '@linkedearth/lipd-ui';
import { getVSCodeAPI } from './vscode';

// Get VS Code API singleton
const vscode = getVSCodeAPI();

/**
 * VS Code specific implementation of LiPD store callbacks
 */
export const vsCodeStoreCallbacks: LiPDStoreCallbacks = {
  onUndo: () => {
    vscode.postMessage({
      type: 'executeCommand',
      command: 'lipd-vscode.undo'
    });
  },
  
  onRedo: () => {
    vscode.postMessage({
      type: 'executeCommand',
      command: 'lipd-vscode.redo'
    });
  },
  
  onSave: () => {
    vscode.postMessage({
      type: 'save'
    });
  },
  
  onSaveAs: () => {
    vscode.postMessage({
      type: 'executeCommand',
      command: 'workbench.action.files.saveAs'
    });
  },
  
  onSync: () => {
    // Use the new saveRemoteLiPD approach instead of the old sync method
    vscode.postMessage({
      type: 'saveRemoteLiPD'
    });
  },
  
  onDatasetUpdated: (dataset: Dataset) => {
    vscode.postMessage({
      type: 'datasetUpdated',
      data: dataset
    });
  },
  
  onReady: () => {
    console.log('Sending ready message to VS Code');
    vscode.postMessage({ 
      type: 'ready' 
    });
  }
}; 