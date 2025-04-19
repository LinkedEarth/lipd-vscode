import { Dataset } from "lipdjs";

// Interface for VS Code message types
export type VSCodeMessage = 
    | { type: 'init'; data: any; canUndo?: boolean; canRedo?: boolean; isRemote?: boolean; datasetName?: string }
    | { type: 'ready' }
    | { type: 'datasetLoaded'; data: any }
    | { type: 'error'; error: string }
    | { type: 'loading'; datasetName: string; message: string }
    | { type: 'saveComplete'; success: boolean; error?: string }
    | { type: 'syncComplete'; success: boolean; syncCompleted?: boolean; error?: string }
    | { type: 'validation'; results: { errors?: Record<string, any>; warnings?: Record<string, any> } }
    | { type: 'themeChanged'; theme: ThemeMode }
    | { type: 'datasetChanged'; data: any; source: string }
    | { type: 'undoRedoStateChanged'; canUndo: boolean; canRedo: boolean };

// Interface for notification state
export interface Notification {
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
}

export type ThemeMode = 'light' | 'dark' | 'high-contrast';

// Interface for app state
export interface AppState {
    // Dataset and loading state
    dataset: Dataset | null;
    isLoading: boolean;
    isSaving: boolean;
    isSyncing: boolean;  // Added for GraphDB sync status
    isRemote: boolean;  // Flag to indicate if dataset is from remote source
    datasetName: string; // Name of the dataset (especially for remote datasets)
    loadingMessage?: string;
    syncProgress?: number; // Optional progress indicator (0-100)
    
    // Undo/Redo state
    canUndo: boolean;
    canRedo: boolean;
    
    // UI state
    selectedNode: string | null;
    expandedNodes: Set<string>;
    rightPanelOpen: boolean;
    selectedTab: number;
    themeMode: ThemeMode;
    
    // Validation state
    validationErrors: Record<string, any>;
    validationWarnings: Record<string, any>;
    
    // Status notification
    notification: { type: string; message: string } | null;
    
    // Actions
    initialize: () => void;
    setIsLoading: (isLoading: boolean) => void;
    setLoadingMessage: (message: string) => void;
    setThemeMode: (mode: ThemeMode) => void;
    setDataset: (dataset: Dataset | null) => void;
    setDatasetSilently: (dataset: Dataset | null) => void;
    undo: () => void;
    redo: () => void;
    setUndoRedoState: (canUndo: boolean, canRedo: boolean) => void;
    setSelectedNode: (node: string | null) => void;
    toggleExpandNode: (nodeId: string) => void;
    setError: (error: string) => void;
    setSaveComplete: (success: boolean, error?: string) => void;
    setSyncComplete: (success: boolean, error?: string) => void;
    setValidationResults: (results: { errors?: Record<string, any>; warnings?: Record<string, any> }) => void;
    saveDataset: () => Promise<void>;
    saveDatasetAs: () => Promise<void>;
    syncDataset: () => Promise<void>;
    toggleRightPanel: () => void;
    setSelectedTab: (tab: number) => void;
    updateDataset: (field: string, value: any) => void;
    setExpandedNodes: (nodes: Set<string>) => void;
    setIsRemote: (isRemote: boolean) => void;
    setDatasetName: (datasetName: string) => void;
}

export interface Model {
    getName(): string | null;
    getDescription(): string | null;
    getCode(): string | null;
    getEnsembleTables(): any[];
    getSummaryTables(): any[];
    getDistributionTables(): any[];
    setName(name: string): void;
    setDescription(description: string): void;
    setCode(code: string): void;
    setEnsembleTables(tables: any[]): void;
    setSummaryTables(tables: any[]): void;
    setDistributionTables(tables: any[]): void;
} 