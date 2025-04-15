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
        // Send ready message to VS Code
        vscode.postMessage({ type: 'ready' });
        
        // Request theme info from VS Code
        vscode.postMessage({ type: 'getTheme' });
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
                        console.log('pathToHere:', pathToHere);
                        console.log('schema:', schema);
                        
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
        console.log('Updating dataset field:', field, 'with value:', value);
        updateNestedProperty(dataset, field, value);
        console.log('dataset:', dataset);

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