import * as vscode from 'vscode';
import * as path from 'path';
import { LiPDFileHandler } from '../lipdFileHandler';
import { Logger } from '../utils/logger';
import { LiPD } from 'lipdjs';

// Default GraphDB URL, can be overridden in settings
const DEFAULT_GRAPHDB_URL = 'https://linkedearth.graphdb.mint.isi.edu/repositories/LiPDVerse-dynamic';

// Define tree data model for LiPD Explorer
export class LiPDTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly type: 'dataset' | 'category' = 'dataset',
        public readonly datasetName?: string
    ) {
        super(label, collapsibleState);

        // Set contextValue based on type to enable context menu filtering
        this.contextValue = type;

        // Set appropriate icon based on type
        if (type === 'dataset') {
            this.iconPath = new vscode.ThemeIcon('notebook');
            
            // Only datasets should be clickable to open
            if (datasetName) {
                this.command = {
                    command: 'lipd-vscode.openRemoteLiPD',
                    title: 'Open Remote LiPD Dataset',
                    arguments: [datasetName]
                };
            }
        } else if (type === 'category') {
            this.iconPath = new vscode.ThemeIcon('folder');
        }
    }
}

export class LiPDExplorerProvider implements vscode.TreeDataProvider<LiPDTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<LiPDTreeItem | undefined | null | void> = new vscode.EventEmitter<LiPDTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<LiPDTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
    
    private logger = Logger.getInstance();
    private disposables: vscode.Disposable[] = [];
    private graphDbUrl: string;
    private datasetNames: string[] = [];
    private searchTerm: string = '';

    constructor(
        private context: vscode.ExtensionContext,
        private lipdHandler: LiPDFileHandler
    ) {
        // Get GraphDB URL from settings or use default
        this.graphDbUrl = vscode.workspace.getConfiguration('lipd').get('graphDbUrl') || 
                          context.workspaceState.get('graphDbUrl') || 
                          DEFAULT_GRAPHDB_URL;
        
        // Create a status bar item to show/refresh connection status
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        statusBarItem.text = "$(database) LiPD GraphDB";
        statusBarItem.tooltip = "Connected to LiPD GraphDB";
        statusBarItem.command = 'lipd-vscode.setGraphDbUrl';
        statusBarItem.show();
        
        this.disposables.push(statusBarItem);
        
        // Initialize context variable for search
        vscode.commands.executeCommand('setContext', 'lipd.explorerHasSearch', false);
        
        // Fetch datasets initially
        this.fetchDatasetNames();
    }

    refresh(): void {
        this.fetchDatasetNames();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: LiPDTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: LiPDTreeItem): Promise<LiPDTreeItem[]> {
        // If no element is provided, show categories
        if (!element) {
            return this.getCategories();
        }

        // If element is a category, show datasets in that category
        if (element.type === 'category' && element.label === 'All Datasets') {
            return this.getAllDatasets();
        }

        return [];
    }

    private getCategories(): LiPDTreeItem[] {
        return [
            new LiPDTreeItem('All Datasets', vscode.TreeItemCollapsibleState.Expanded, 'category')
        ];
    }

    private async getAllDatasets(): Promise<LiPDTreeItem[]> {
        if (this.datasetNames.length === 0) {
            return [new LiPDTreeItem('No datasets found or loading...', vscode.TreeItemCollapsibleState.None)];
        }

        // Filter datasets by search term if one exists
        const filteredNames = this.searchTerm 
            ? this.datasetNames.filter(name => 
                name.toLowerCase().includes(this.searchTerm.toLowerCase()))
            : this.datasetNames;

        // If search is active but no results found
        if (this.searchTerm && filteredNames.length === 0) {
            return [new LiPDTreeItem(`No results for "${this.searchTerm}"`, vscode.TreeItemCollapsibleState.None)];
        }

        // Sort dataset names alphabetically
        const sortedNames = [...filteredNames].sort();
        
        return sortedNames.map(name => {
            return new LiPDTreeItem(name, vscode.TreeItemCollapsibleState.None, 'dataset', name);
        });
    }

    private async fetchDatasetNames(): Promise<void> {
        try {
            this.logger.info(`Fetching dataset names from GraphDB endpoint: ${this.graphDbUrl}`);
            
            const lipd = new LiPD();
            lipd.setEndpoint(this.graphDbUrl);
            lipd.setRemote(true);
            
            // Fetch all dataset names from the remote endpoint
            const datasets = await lipd.getAllDatasetNames();
            
            if (!datasets || datasets.length === 0) {
                this.logger.warn('No datasets found in GraphDB or response was empty');
                this.datasetNames = [];
                vscode.window.showWarningMessage('No datasets found in the GraphDB repository');
            } else {
                this.logger.info(`Found ${datasets.length} datasets in GraphDB`);
                this.datasetNames = datasets;
            }
            
            // Fire the event to refresh the tree view
            this._onDidChangeTreeData.fire();
        } catch (error) {
            this.logger.error('Error fetching dataset names from GraphDB:', error);
            
            // Show a more detailed error message
            const errorMessage = `Failed to fetch LiPD datasets: ${error instanceof Error ? error.message : String(error)}`;
            
            // Create notification with retry button
            const retry = 'Retry';
            const configure = 'Configure Endpoint';
            
            vscode.window.showErrorMessage(errorMessage, retry, configure).then(selection => {
                if (selection === retry) {
                    this.fetchDatasetNames();
                } else if (selection === configure) {
                    this.setGraphDbUrl();
                }
            });
            
            this.datasetNames = [];
            this._onDidChangeTreeData.fire();
        }
    }

    private async openRemoteDataset(datasetName: string): Promise<void> {
        this.logger.info(`Loading remote dataset: ${datasetName}`);
        
        try {
            // First, open the editor immediately with a loading state
            let webviewPanel: vscode.WebviewPanel | undefined;
            
            try {
                // Open a placeholder editor while we load the data
                webviewPanel = await vscode.commands.executeCommand(
                    'lipd-vscode.openRemoteDatasetInEditor', 
                    null, // Pass null to indicate loading state
                    datasetName
                );
                
                this.logger.info(`Opened placeholder editor for dataset: ${datasetName}`);
            } catch (error) {
                this.logger.error('Failed to open editor:', error);
                throw new Error(`Failed to open editor: ${error instanceof Error ? error.message : String(error)}`);
            }
            
            if (!webviewPanel) {
                throw new Error('Failed to create webview panel');
            }
            
            // Now load the actual dataset in the background
            try {
                // Create LiPD instance
                const lipd = new LiPD();
                lipd.setEndpoint(this.graphDbUrl);
                lipd.setRemote(true);
                
                // Load the dataset from the remote endpoint
                this.logger.info(`Fetching dataset ${datasetName} from GraphDB...`);
                await lipd.loadRemoteDatasets(datasetName, false);
                
                const datasets = await lipd.getDatasets();
                if (!datasets || datasets.length === 0) {
                    throw new Error('No dataset found');
                }
                
                const dataset = datasets[0];
                
                // Update the editor with the loaded dataset
                this.logger.info(`Dataset ${datasetName} loaded, updating editor...`);
                await vscode.commands.executeCommand(
                    'lipd-vscode.updateRemoteDatasetInEditor',
                    webviewPanel,
                    dataset,
                    datasetName
                );
                
                this.logger.info(`Dataset ${datasetName} successfully loaded and displayed`);
            } catch (error) {
                this.logger.error(`Error loading dataset ${datasetName}:`, error);
                
                // Send error to the webview if it exists
                if (webviewPanel) {
                    webviewPanel.webview.postMessage({
                        type: 'error',
                        error: `Failed to load dataset: ${error instanceof Error ? error.message : String(error)}`
                    });
                }
                
                throw error;
            }
        } catch (error) {
            this.logger.error(`Error handling remote dataset ${datasetName}:`, error);
            
            // Create a detailed error message
            const errorMessage = `Failed to load dataset '${datasetName}': ${error instanceof Error ? error.message : String(error)}`;
            
            // Show error with retry option
            const retry = 'Retry';
            vscode.window.showErrorMessage(errorMessage, retry).then(selection => {
                if (selection === retry) {
                    this.openRemoteDataset(datasetName);
                }
            });
        }
    }

    public async setGraphDbUrl(): Promise<void> {
        const newUrl = await vscode.window.showInputBox({
            prompt: 'Enter GraphDB SPARQL endpoint URL',
            value: this.graphDbUrl,
            placeHolder: DEFAULT_GRAPHDB_URL
        });
        
        if (newUrl !== undefined) {
            this.graphDbUrl = newUrl || DEFAULT_GRAPHDB_URL;
            
            // Save the new URL to workspace state
            this.context.workspaceState.update('graphDbUrl', this.graphDbUrl);
            
            // Also save to settings
            vscode.workspace.getConfiguration('lipd').update('graphDbUrl', this.graphDbUrl, true);
            
            // Refresh the explorer
            this.refresh();
            
            vscode.window.showInformationMessage(`GraphDB endpoint updated: ${this.graphDbUrl}`);
        }
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
    }

    // Static method to register the explorer
    public static register(context: vscode.ExtensionContext, lipdHandler: LiPDFileHandler): vscode.Disposable {
        const provider = new LiPDExplorerProvider(context, lipdHandler);
        
        // Register the tree data provider
        const treeView = vscode.window.createTreeView('lipdExplorer', {
            treeDataProvider: provider,
            showCollapseAll: true
        });
        
        // Register a command to refresh the explorer
        const refreshCommand = vscode.commands.registerCommand(
            'lipd-vscode.refreshExplorer',
            () => provider.refresh()
        );
        
        // Register command to set GraphDB URL
        const setUrlCommand = vscode.commands.registerCommand(
            'lipd-vscode.setGraphDbUrl',
            () => provider.setGraphDbUrl()
        );
        
        // Register command to open a remote dataset
        const openRemoteCommand = vscode.commands.registerCommand(
            'lipd-vscode.openRemoteLiPD',
            (datasetName: string) => provider.openRemoteDataset(datasetName)
        );
        
        // Register command to search datasets
        const searchCommand = vscode.commands.registerCommand(
            'lipd-vscode.searchDatasets',
            () => provider.searchDatasets()
        );
        
        // Register command to clear search
        const clearSearchCommand = vscode.commands.registerCommand(
            'lipd-vscode.clearSearch',
            () => provider.clearSearch()
        );
        
        return vscode.Disposable.from(
            treeView, 
            refreshCommand, 
            setUrlCommand,
            openRemoteCommand,
            searchCommand,
            clearSearchCommand,
            ...provider.disposables
        );
    }

    // New method to search datasets
    public async searchDatasets(): Promise<void> {
        const searchTerm = await vscode.window.showInputBox({
            prompt: 'Search datasets by name',
            placeHolder: 'Enter search term...',
            value: this.searchTerm
        });
        
        // Only update if the search term has changed
        if (searchTerm !== undefined && searchTerm !== this.searchTerm) {
            this.searchTerm = searchTerm;
            
            // Set context variable to control showing clear button
            vscode.commands.executeCommand('setContext', 'lipd.explorerHasSearch', !!this.searchTerm);
            
            // Refresh the tree view to show filtered results
            this._onDidChangeTreeData.fire();
        }
    }
    
    // Method to clear the search
    public clearSearch(): void {
        if (this.searchTerm !== '') {
            this.searchTerm = '';
            
            // Update context variable
            vscode.commands.executeCommand('setContext', 'lipd.explorerHasSearch', false);
            
            this._onDidChangeTreeData.fire();
        }
    }
} 