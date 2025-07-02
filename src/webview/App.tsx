import React, { useEffect, useMemo } from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme, Alert, Snackbar, AppBar, Toolbar, Typography } from '@mui/material';
import { Dataset } from 'lipdjs';
import { VSCodeMessage, ThemeMode } from './types';
import {
  useLiPDStore,
  NavigationPanel,
  EditorPanel,
  AppBarBreadcrumbs,
  AppBarActions,
  SyncProgressBar,
  RouterProvider,
  ConfirmDialog
} from '@linkedearth/lipd-ui';
import { getVSCodeAPI, postMessage } from './vscode';

// Set up initialTheme from window if available
declare global {
    interface Window {
        initialTheme?: ThemeMode;
    }
}

// Handle messages from VS Code extension
window.addEventListener('message', (event: MessageEvent) => {
    const message = event.data as VSCodeMessage;
    console.log('Received message from VS Code:', message.type);
    
    switch (message.type) {
        case 'init':
            // Initialize dataset with data from VS Code
            console.log('Received init message with dataset:', message.data ? 'data present' : 'no data');
            if (message.data) {
                try {
                    // Convert the plain object to a Dataset instance
                    const dataset = Dataset.fromDictionary(message.data);
                    
                    // Update the store with the dataset
                    useLiPDStore.getState().setDataset(dataset);
                    
                    // Set loading state to false
                    useLiPDStore.getState().setIsLoading(false);
                    
                    // Update undo/redo state
                    useLiPDStore.getState().setUndoRedoState(
                        message.canUndo === true, 
                        message.canRedo === true
                    );
                    
                    // Set remote flag
                    if (message.isRemote) {
                        useLiPDStore.getState().setIsRemote(true);
                        if (message.datasetName) {
                            useLiPDStore.getState().setDatasetName(message.datasetName);
                        }
                    }
                    
                    // Send initialization complete message
                    postMessage({ type: 'initComplete' });
                } catch (error) {
                    console.error('Error processing dataset:', error);
                    useLiPDStore.getState().setError('Failed to parse dataset data: ' + 
                        (error instanceof Error ? error.message : String(error)));
                    // Set loading state to false even if there's an error
                    useLiPDStore.getState().setIsLoading(false);
                    
                    // Send error message
                    postMessage({ 
                        type: 'initError', 
                        error: (error instanceof Error ? error.message : String(error))
                    });
                }
            } else {
                console.error('No dataset data received in init message');
                // No data received, set loading to false
                useLiPDStore.getState().setIsLoading(false);
                
                // Send error message
                postMessage({ 
                    type: 'initError', 
                    error: 'No dataset data received in init message'
                });
            }
            break;
            
        case 'loading':
            // Show loading state for remote datasets
            console.log('Received loading message for dataset:', message.datasetName);
            
            // Set the dataset name if provided
            if (message.datasetName) {
                useLiPDStore.getState().setDatasetName(message.datasetName);
            }
            
            // Set dataset to null to ensure forms don't show
            useLiPDStore.getState().setDataset(null);
            
            // Set loading state to true and show loading message
            useLiPDStore.getState().setIsLoading(true);
            if (message.message) {
                useLiPDStore.getState().setLoadingMessage(message.message);
            }
            
            // Set remote flag
            useLiPDStore.getState().setIsRemote(true);
            break;
            
        case 'ready':
            // VS Code notifying us it's ready - this shouldn't happen normally
            console.log('Received ready message from VS Code - this is unusual');
            break;
            
        case 'datasetLoaded':
            // Legacy message type, handle same as init
            console.log('Received legacy datasetLoaded message, treating as init');
            if (message.data) {
                try {
                    // Convert the plain object to a Dataset instance
                    const dataset = Dataset.fromDictionary(message.data);
                    
                    // Update the store with the dataset
                    useLiPDStore.getState().setDataset(dataset);
                    
                    // Set loading state to false
                    useLiPDStore.getState().setIsLoading(false);
                } catch (error) {
                    console.error('Error processing dataset:', error);
                    useLiPDStore.getState().setError('Failed to parse dataset data: ' + 
                        (error instanceof Error ? error.message : String(error)));
                    // Set loading state to false even if there's an error
                    useLiPDStore.getState().setIsLoading(false);
                }
            } else {
                console.error('No dataset data received in datasetLoaded message');
                // No data received, set loading to false
                useLiPDStore.getState().setIsLoading(false);
            }
            break;
            
        case 'error':
            // Handle error messages
            if (message.error) {
                useLiPDStore.getState().setError(message.error as string);
                // Set loading state to false
                useLiPDStore.getState().setIsLoading(false);
            }
            break;
            
        case 'saveComplete':
            // Handle save completion
            useLiPDStore.getState().setSaveComplete(message.success as boolean, message.error as string);
            break;
            
        case 'syncComplete':
            useLiPDStore.getState().setSyncComplete(message.success as boolean, message.error as string);
            break;
            
        case 'validation':
            // Handle validation results
            if (message.results) {
                useLiPDStore.getState().setValidationResults(message.results);
            }
            break;
            
        case 'themeChanged':
            // Handle theme change from VS Code
            if (message.theme) {
                useLiPDStore.getState().setThemeMode(message.theme as ThemeMode);
            }
            break;
            
        case 'datasetChanged':
            // Handle dataset changes from undo/redo operations
            if (message.data) {
                try {
                    console.log(`Dataset changed due to ${message.source} operation`);
                    
                    // Convert the dataset to a Dataset instance if needed
                    const dataset = message.data instanceof Dataset ? 
                        message.data : Dataset.fromDictionary(message.data);
                    
                    // Update the store with the updated dataset without triggering a new history entry
                    useLiPDStore.getState().setDatasetSilently(dataset);
                } catch (error) {
                    console.error('Error processing dataset change:', error);
                    useLiPDStore.getState().setError('Failed to update dataset: ' + 
                        (error instanceof Error ? error.message : String(error)));
                }
            }
            break;
            
        case 'undoRedoStateChanged':
            // Update the UI with current undo/redo state
            useLiPDStore.getState().setUndoRedoState(
                message.canUndo === true, 
                message.canRedo === true
            );
            break;
    }
});

const App: React.FC = () => {
    const dataset = useLiPDStore((state: any) => state.dataset);
    const notification = useLiPDStore((state: any) => state.notification);
    const rightPanelOpen = useLiPDStore((state: any) => state.rightPanelOpen);
    const initialize = useLiPDStore((state: any) => state.initialize);
    const selectedNode = useLiPDStore((state: any) => state.selectedNode);
    const themeMode = useLiPDStore((state: any) => state.themeMode || window.initialTheme || 'light');
    const datasetName = useLiPDStore((state: any) => state.datasetName);
    const isLoading = useLiPDStore((state: any) => state.isLoading);
    const loadingMessage = useLiPDStore((state: any) => state.loadingMessage);
    const syncConfirmDialogOpen = useLiPDStore((state: any) => state.syncConfirmDialogOpen);
    const setSyncConfirmDialogOpen = useLiPDStore((state: any) => state.setSyncConfirmDialogOpen);
    const confirmSync = useLiPDStore((state: any) => state.confirmSync);
    
    // Initialize the store when the app mounts and set the initial theme if available
    useEffect(() => {
        // Set initial theme from window if available
        if (window.initialTheme) {
            useLiPDStore.getState().setThemeMode(window.initialTheme);
        }
        
        // Initialize the store
        initialize();
    }, [initialize]);

    const handleSyncConfirm = () => {
        confirmSync();
    };

    const handleSyncCancel = () => {
        setSyncConfirmDialogOpen(false);
    };

    // Create theme based on VS Code theme
    const theme = useMemo(() => createTheme({
        palette: {
            mode: themeMode === 'high-contrast' ? 'dark' : themeMode,
            background: {
                default: themeMode === 'dark' ? '#1e1e1e' : '#ffffff',
                paper: themeMode === 'dark' ? '#252526' : '#ffffff',
            },
            text: {
                primary: themeMode === 'dark' ? '#cccccc' : '#333333',
                secondary: themeMode === 'dark' ? '#9d9d9d' : '#737373',
            },
            divider: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
            primary: {
                main: themeMode === 'dark' ? '#0078d4' : '#0066b8',
            },
        },
        typography: {
            fontSize: 13,
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            h6: {
                fontSize: '0.875rem',
                fontWeight: 500,
            },
            body1: {
                fontSize: '0.8125rem',
            },
            body2: {
                fontSize: '0.75rem',
            }
        },
        components: {
            Paper: {
                styleOverrides: {
                    root: {
                        padding: 0,
                    }
                }
            },
            TableCell: {
                styleOverrides: {
                    root: {
                        padding: '8px 16px',
                        fontSize: '0.8125rem',
                    }
                }
            },
            AppBar: {
                styleOverrides: {
                    root: {
                        boxShadow: 'none',
                        borderBottom: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`
                    }
                }
            },
            Toolbar: {
                styleOverrides: {
                    root: {
                        minHeight: '48px',
                        padding: 0
                    }
                }
            }
        }
    }), [themeMode]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <RouterProvider>
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    height: '100vh',
                    overflow: 'hidden'
                }}>
                    <AppBar 
                        position="static" 
                        color="default" 
                        elevation={0}
                        sx={{ 
                            boxShadow: 'none',
                            borderBottom: `1px solid ${themeMode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}` 
                        }}
                    >
                        <Toolbar>
                            <AppBarBreadcrumbs />
                            <AppBarActions />
                        </Toolbar>
                    </AppBar>
                    <Box sx={{ 
                        display: 'flex',
                        flex: 1,
                        overflow: 'hidden'
                    }}>
                        <Box sx={{ 
                            width: 300, 
                            flexShrink: 0,
                            borderRight: '1px solid',
                            borderColor: 'divider',
                            overflow: 'auto'
                        }}>
                            <NavigationPanel />
                        </Box>
                        <Box sx={{ 
                            flex: 1,
                            overflow: 'auto',
                            display: rightPanelOpen ? 'block' : 'none'
                        }}>
                            <EditorPanel />
                        </Box>
                    </Box>
                </Box>
            </RouterProvider>
            {notification && (
                <Snackbar 
                    open={!!notification} 
                    autoHideDuration={6000} 
                    onClose={() => useLiPDStore.setState({ notification: null })}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert 
                        onClose={() => useLiPDStore.setState({ notification: null })} 
                        severity={notification.type as any} 
                        sx={{ width: '100%' }}
                    >
                        {notification.message}
                    </Alert>
                </Snackbar>
            )}
            <SyncProgressBar />
            <ConfirmDialog
                open={syncConfirmDialogOpen}
                title="Sync to GraphDB"
                message="Are you sure you want to sync this dataset to GraphDB? This action will update the remote database and requires authentication credentials."
                onConfirm={handleSyncConfirm}
                onCancel={handleSyncCancel}
            />
        </ThemeProvider>
    );
};

export default App; 