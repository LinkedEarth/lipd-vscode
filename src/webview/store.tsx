import create from 'zustand';
import { Dataset } from 'lipdjs';
import { AppState, ThemeMode } from './types';
import { getVSCodeAPI } from './vscode';
import { getSchemaForPath } from './schemas'

// Get VS Code API singleton
const vscode = getVSCodeAPI();


// Create a store for our application state
export const useLiPDStore = create<AppState>((set, get) => ({
    // Dataset state
    dataset: null,
    isLoading: false,
    isSaving: false,
    
    // Undo/Redo state
    canUndo: false,
    canRedo: false,
    
    // UI state
    selectedNode: null,
    expandedNodes: new Set(['dataset']),
    rightPanelOpen: true,
    selectedTab: 0,
    themeMode: 'light', // New state for theme mode
    
    // Validation state
    validationErrors: {},
    validationWarnings: {},
    
    // Status notifications
    notification: null,
    
    // Actions
    initialize: () => {
        console.log('Initializing LiPD editor');
        // Set loading state to true to show loading indicator
        set({ isLoading: true });
        
        // Send ready message to VS Code
        try {
            console.log('Sending ready message to VS Code');
            vscode.postMessage({ type: 'ready' });
        } catch (error) {
            console.error('Error sending ready message:', error);
            set({ 
                isLoading: false,
                notification: {
                    type: 'error',
                    message: 'Failed to initialize: Could not communicate with VS Code'
                }
            });
        }
        
        // Request theme info from VS Code
        try {
            vscode.postMessage({ type: 'getTheme' });
        } catch (error) {
            console.error('Error requesting theme:', error);
        }
    },
    
    setIsLoading: (isLoading: boolean) => {
        set({ isLoading });
    },
    
    setThemeMode: (mode: ThemeMode) => {
        set({ themeMode: mode });
    },
    
    setDataset: (dataset) => {
        set({ 
            dataset,
            selectedNode: 'dataset'
        });
    },
    
    setDatasetSilently: (dataset) => {
        // Updates the dataset without triggering an extension message
        // Used by undo/redo to avoid creating new history entries
        set({ dataset });
    },
    
    undo: () => {
        // Request an undo operation from the extension
        vscode.postMessage({
            type: 'executeCommand',
            command: 'workbench.action.editor.undo'
        });
    },
    
    redo: () => {
        // Request a redo operation from the extension
        vscode.postMessage({
            type: 'executeCommand',
            command: 'workbench.action.editor.redo'
        });
    },
    
    setUndoRedoState: (canUndo: boolean, canRedo: boolean) => {
        set({ canUndo, canRedo });
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
    
    saveDataset: () => {
        // Set saving state to true
        set({ isSaving: true });
        
        // Request a save operation from the extension
        vscode.postMessage({
            type: 'executeCommand',
            command: 'workbench.action.files.save'
        });
        
        return Promise.resolve();
    },
    
    saveDatasetAs: () => {
        // Set saving state to true
        set({ isSaving: true });
        
        // Request a saveAs operation from the extension
        vscode.postMessage({
            type: 'executeCommand',
            command: 'workbench.action.files.saveAs'
        });
        
        return Promise.resolve();
    },
    
    toggleRightPanel: () => set({ rightPanelOpen: !get().rightPanelOpen }),
    
    setSelectedTab: (tab) => set({ selectedTab: tab }),
    
    updateDataset: (field, value) => {
        // console.log('Updating dataset field:', field, 'with value:', value);
        const dataset = { ...get().dataset } as Dataset;
        
        const updateNestedProperty = (obj: any, path: string | string[], value: any): any => {
            if (typeof path === 'string') {
                // Handle dot notation paths
                const parts = path.split('.');
                const lastKey = parts.pop() as string;
                if (parts.length > 0 && parts[0] === 'dataset') {
                    parts.shift();
                }

                let current = obj;
                
                // Traverse the path
                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    if (!current[part]) {
                        // Get the schema for this path
                        const pathToHere = ['dataset', ...parts.slice(0, i+1)].join('.');
                        const schema = getSchemaForPath(pathToHere);
                        
                        // If we have a schema, create a proper instance
                        if (schema) {
                            // For arrays, create an empty array since we're accessing an index
                            if (parts[i+1] && !isNaN(Number(parts[i+1]))) {
                                current[part] = [];
                            } else if ('class' in schema && schema.class) {
                                // For objects with a class, instantiate the class
                                current[part] = new schema.class();
                            } else if ('type' in schema && schema.type === 'array' && 'items' in schema && schema.items) {
                                // For arrays with item schema, create an empty array
                                current[part] = [];
                            } else {
                                // Fallback to empty object
                                current[part] = {};
                            }
                        } else {
                            // Fallback to empty object if no schema found
                            current[part] = {};
                        }
                    }
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

        // console.log('Sending datasetUpdated message to VS Code');
        vscode.postMessage({
            type: 'datasetUpdated',
            data: dataset
        });
    },
    
    setExpandedNodes: (nodes) => set({ expandedNodes: nodes })
}));