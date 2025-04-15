import { Dataset } from "lipdjs";

// Interface for VS Code message types
export interface VSCodeMessage {
    type: string;
    [key: string]: any;
}

// Interface for notification state
export interface Notification {
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
}

export type ThemeMode = 'light' | 'dark' | 'high-contrast';

// Interface for app state
export interface AppState {
    // Dataset state
    dataset: Dataset | null;
    isLoading: boolean;
    isSaving: boolean;
    
    // UI state
    selectedNode: string | null;
    expandedNodes: Set<string>;
    rightPanelOpen: boolean;
    selectedTab: number;
    themeMode: ThemeMode;
    
    // Validation state
    validationErrors: Record<string, any>;
    validationWarnings: Record<string, any>;
    
    // Status notifications
    notification: Notification | null;
    
    // Actions
    initialize: () => void;
    setDataset: (dataset: any) => void;
    setIsLoading: (isLoading: boolean) => void;
    setThemeMode: (mode: ThemeMode) => void;
    setError: (error: string) => void;
    setSaveComplete: (success: boolean, error?: string) => void;
    setValidationResults: (results: { errors?: Record<string, any>; warnings?: Record<string, any> }) => void;
    saveDataset: () => Promise<void>;
    setSelectedNode: (node: string | null) => void;
    setExpandedNodes: (nodes: Set<string>) => void;
    toggleExpandNode: (nodeId: string) => void;
    toggleRightPanel: () => void;
    setSelectedTab: (tab: number) => void;
    updateDataset: (field: string | string[], value: any) => void;
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