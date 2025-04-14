import create from 'zustand';
import { Dataset } from 'lipdjs';
import { AppState } from './types';
import { getVSCodeAPI } from './vscode';

// Get VS Code API singleton
const vscode = getVSCodeAPI();

// Create a store for our application state
export const useLiPDStore = create<AppState>((set, get) => ({
    // Dataset state
    dataset: null,
    isLoading: false,
    isSaving: false,
    
    // UI state
    selectedNode: null,
    expandedNodes: new Set(['']),
    rightPanelOpen: true,
    selectedTab: 0,
    
    // Validation state
    validationErrors: {},
    validationWarnings: {},
    
    // Status notifications
    notification: null,
    
    // Actions
    initialize: () => {
        // Send ready message to VS Code
        vscode.postMessage({ type: 'ready' });
    },
    
    setDataset: (dataset) => {
        set({ 
            dataset,
            selectedNode: 'dataset'
        });
        
        // Send message to extension
        if (dataset) {
            vscode.postMessage({
                type: 'datasetUpdated',
                data: dataset
            });
        }
    },
    
    setSelectedNode: (node) => {
        // console.log('Setting selected node:', node);
        set({ selectedNode: node })
    },
    
    toggleExpandNode: (nodeId: string) => {
        const { expandedNodes } = get();
        const newExpandedNodes = new Set(expandedNodes);
        
        if (newExpandedNodes.has(nodeId)) {
            newExpandedNodes.delete(nodeId);
        } else {
            newExpandedNodes.add(nodeId);
        }
        
        set({ expandedNodes: newExpandedNodes });
    },
    
    setError: (error) => {
        set({ 
            validationErrors: { error },
            notification: {
                type: 'error',
                message: error
            }
        });
    },
    
    setSaveComplete: (success, error) => {
        set({ 
            isSaving: false,
            notification: success ? {
                type: 'success',
                message: 'Dataset saved successfully'
            } : {
                type: 'error',
                message: error || 'Failed to save dataset'
            }
        });
    },
    
    setValidationResults: (results) => {
        set({
            validationErrors: results.errors || {},
            validationWarnings: results.warnings || {}
        });
    },
    
    saveDataset: async () => {
        const { dataset } = get();
        if (!dataset) return;
        
        set({ isSaving: true });
        
        // Send message to extension
        vscode.postMessage({
            type: 'saveDataset',
            data: dataset
        });
    },
    
    toggleRightPanel: () => set({ rightPanelOpen: !get().rightPanelOpen }),
    
    setSelectedTab: (tab) => set({ selectedTab: tab }),
    
    updateDataset: (field, value) => {
        // console.log('Updating dataset field:', field, 'with value:', value);
        const dataset = { ...get().dataset } as Dataset;
        
        // For direct field updates, try to use a setter if available
        if (typeof field === 'string' && !field.includes('.')) {
            const setterName = `set${field.charAt(0).toUpperCase()}${field.slice(1)}`;
            // Use type-safe approach for accessing object methods
            if (dataset && typeof (dataset as any)[setterName] === 'function') {
                (dataset as any)[setterName](value);
                // console.log(`Called setter ${setterName} directly`);
                
                // Force state update
                set({ dataset });
                
                // Send message to extension
                vscode.postMessage({
                    type: 'datasetUpdated',
                    data: dataset
                });
                
                return;
            }
        }
        
        const updateNestedProperty = (obj: any, path: string | string[], value: any): any => {
            if (typeof path === 'string') {
                // Handle dot notation paths
                const parts = path.split('.');
                parts.shift(); // Remove the first part, which is the dataset

                const lastKey = parts.pop() as string;
                if (parts.length > 0 && parts[0] === '') {
                    parts.shift();
                }

                let current = obj;
                
                // Traverse the path
                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    current = current[part];
                }
                
                // Try to use setter if available
                current[lastKey] = value
            } else if (Array.isArray(path) && path.length === 1) {
                // If it's an array with just one string element
                obj[path[0]] = value;
            } else {
                console.error('Invalid path format', path);
            }
            return obj;
        };
        updateNestedProperty(dataset, field, value);
        
        // Force state update with properly typed dataset
        set({ dataset });
        
        // Send message to extension
        vscode.postMessage({
            type: 'datasetUpdated',
            data: dataset
        });
    },
    
    setExpandedNodes: (nodes) => set({ expandedNodes: nodes })
}));