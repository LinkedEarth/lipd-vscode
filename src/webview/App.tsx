import React, { useEffect, useMemo } from 'react';
import { 
    Box, 
    CssBaseline, 
    ThemeProvider, 
    createTheme, 
    Alert, 
    Snackbar, 
    AppBar, 
    Toolbar, 
    Typography, 
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton
} from '@mui/material';
import {
    Save as SaveIcon,
    SaveAs as SaveAsIcon,
    CloudUpload as SyncIcon,
    Undo as UndoIcon,
    Redo as RedoIcon
} from '@mui/icons-material';
import { Dataset } from 'lipdjs';
import { VSCodeMessage, ThemeMode } from './types';
import {
  useLiPDStore,
  setLiPDStoreCallbacks,
  NavigationPanel,
  EditorPanel,
  AppBarBreadcrumbs,
  RouterProvider
} from '@linkedearth/lipd-ui';
import { vsCodeStoreCallbacks } from './lipdStoreCallbacks';
import { getVSCodeAPI } from './vscode';

// Set up initialTheme from window if available
declare global {
    interface Window {
        initialTheme?: ThemeMode;
    }
}

// Set up the VS Code specific store callbacks
setLiPDStoreCallbacks(vsCodeStoreCallbacks);

const App: React.FC = () => {
    const {
        dataset,
        isLoading,
        loadingMessage,
        themeMode,
        notification,
        navPanelOpen,
        syncConfirmDialogOpen,
        setSyncConfirmDialogOpen,
        confirmSync,
        initialize,
        saveDataset,
        saveDatasetAs,
        syncDataset,
        undo,
        redo,
        canUndo,
        canRedo,
        isSaving,
        isSyncing
    } = useLiPDStore((state: any) => ({
        dataset: state.dataset,
        isLoading: state.isLoading,
        loadingMessage: state.loadingMessage,
        themeMode: state.themeMode,
        notification: state.notification,
        navPanelOpen: state.navPanelOpen,
        syncConfirmDialogOpen: state.syncConfirmDialogOpen,
        setSyncConfirmDialogOpen: state.setSyncConfirmDialogOpen,
        confirmSync: state.confirmSync,
        initialize: state.initialize,
        saveDataset: state.saveDataset,
        saveDatasetAs: state.saveDatasetAs,
        syncDataset: state.syncDataset,
        undo: state.undo,
        redo: state.redo,
        canUndo: state.canUndo,
        canRedo: state.canRedo,
        isSaving: state.isSaving,
        isSyncing: state.isSyncing
    }));

    // Local state for sync check
    const [checking, setChecking] = React.useState(false);
    const [graphInfo, setGraphInfo] = React.useState<{endpoint:string; graphUri:string; exists?:boolean; error?:string; hasAuth?:boolean} | null>(null);

    // When confirmation dialog opens, start check
    React.useEffect(() => {
        if (syncConfirmDialogOpen) {
            setChecking(true);
            setGraphInfo(null);
            // Send prepareSync to extension
            const vscode = getVSCodeAPI();
            vscode.postMessage({ type: 'prepareSync' });
        }
    }, [syncConfirmDialogOpen]);

    // Initialize on component mount
    useEffect(() => {
        // Hide the initial loading screen now that React has loaded
        document.body.classList.add('react-loaded');
        
        initialize();
    }, [initialize]);

    const theme = useMemo(() => {
        const initialTheme = window.initialTheme || themeMode;
        return createTheme({
            palette: {
                mode: initialTheme,
            },
            typography: {
                // Reduce base font sizes
                fontSize: 13, // Default was 14, slightly larger than before
                h1: { fontSize: '2rem' }, // Slightly larger
                h2: { fontSize: '1.6rem' }, // Slightly larger
                h3: { fontSize: '1.4rem' }, // Slightly larger
                h4: { fontSize: '1.2rem' }, // Slightly larger
                h5: { fontSize: '1.05rem' }, // Slightly larger
                h6: { fontSize: '0.95rem' }, // Slightly larger
                body1: { fontSize: '0.85rem' }, // Slightly larger
                body2: { fontSize: '0.8rem' }, // Slightly larger
                caption: { fontSize: '0.75rem' }, // Slightly larger
                button: { fontSize: '0.85rem' }, // Slightly larger
            },
            components: {
                // Keep AppBarBreadcrumbs at normal size
                MuiBreadcrumbs: {
                    styleOverrides: {
                        root: {
                            fontSize: '0.875rem', // Keep breadcrumbs at normal size
                            maxWidth: '100%',
                            overflow: 'hidden',
                        },
                        li: {
                            maxWidth: '150px', // Limit individual breadcrumb items
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        },
                    },
                },
                // Reduce form component sizes
                MuiTextField: {
                    styleOverrides: {
                        root: {
                            fontSize: '0.85rem',
                        },
                    },
                },
                MuiButton: {
                    styleOverrides: {
                        root: {
                            fontSize: '0.85rem',
                        },
                    },
                },
                MuiIconButton: {
                    styleOverrides: {
                        root: {
                            fontSize: '0.85rem',
                        },
                    },
                },
                // Target ListView and List components specifically
                MuiList: {
                    styleOverrides: {
                        root: {
                            fontSize: '0.85rem',
                        },
                    },
                },
                MuiListItem: {
                    styleOverrides: {
                        root: {
                            fontSize: '0.85rem',
                        },
                    },
                },
                MuiListItemText: {
                    styleOverrides: {
                        primary: {
                            fontSize: '0.85rem',
                        },
                        secondary: {
                            fontSize: '0.8rem',
                        },
                    },
                },
                // Target table components (for data tables)
                MuiTableCell: {
                    styleOverrides: {
                        root: {
                            fontSize: '0.85rem',
                        },
                    },
                },
                // Target tree view components
                MuiTreeItem: {
                    styleOverrides: {
                        label: {
                            fontSize: '0.85rem',
                        },
                    },
                },
            },
        });
    }, [themeMode]);

    const handleSyncConfirm = () => {
        if (confirmDisabled) return; // extra safety guard
        confirmSync();
    };

    const handleSyncCancel = () => {
        setSyncConfirmDialogOpen(false);
    };

    // Handle messages from VS Code moved inside component to access state setters
    React.useEffect(() => {
        const listener = (event: MessageEvent) => {
            const message = event.data as VSCodeMessage;
            
            switch (message.type) {
                case 'syncInfo':
                    setChecking(false);
                    setGraphInfo({ endpoint: message.endpoint, graphUri: message.graphUri, exists: message.exists, error: message.error, hasAuth: message.hasAuth });
                    break;
                case 'init':
                    // Initialize dataset with data from VS Code
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
                        } catch (error) {
                            console.error('Error processing dataset:', error);
                            useLiPDStore.getState().setError('Failed to parse dataset data: ' + 
                                (error instanceof Error ? error.message : String(error)));
                            // Set loading state to false even if there's an error
                            useLiPDStore.getState().setIsLoading(false);
                        }
                    } else {
                        // No data received, set loading to false
                        useLiPDStore.getState().setIsLoading(false);
                    }
                    break;
                    
                case 'loading':
                    // Show loading state for remote datasets
                    
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
                    break;
                    
                case 'datasetLoaded':
                    // Legacy message type, handle same as init
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
        };
        window.addEventListener('message', listener);
        return () => window.removeEventListener('message', listener);
    }, []);

    // Custom AppBarActions component with Material-UI icons
    const CustomAppBarActions = () => (
        <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            flexShrink: 0, // Prevent shrinking
            minWidth: '180px', // Ensure minimum width for all icons
            justifyContent: 'flex-end' 
        }}>
            {/* Undo/Redo */}
            <IconButton 
                onClick={undo} 
                disabled={!canUndo || isSaving}
                size="small"
                title="Undo"
                sx={{ mr: 0.5 }}
            >
                <UndoIcon fontSize="small" />
            </IconButton>
            
            <IconButton 
                onClick={redo} 
                disabled={!canRedo || isSaving}
                size="small"
                title="Redo"
                sx={{ mr: 1 }}
            >
                <RedoIcon fontSize="small" />
            </IconButton>
            
            {/* Save actions */}
            <IconButton 
                onClick={saveDataset} 
                disabled={isSaving}
                size="small"
                title="Save"
                sx={{ mr: 0.5 }}
            >
                <SaveIcon fontSize="small" />
            </IconButton>
            
            <IconButton 
                onClick={saveDatasetAs} 
                disabled={isSaving}
                size="small"
                title="Save As"
                sx={{ mr: 0.5 }}
            >
                <SaveAsIcon fontSize="small" />
            </IconButton>

            <IconButton 
                onClick={syncDataset} 
                disabled={isSyncing}
                size="small"
                title="Sync to GraphDB"
                sx={{ mr: 0.5 }}
            >
                <SyncIcon fontSize="small" />
            </IconButton>
        </Box>
    );

    // Helper text for dialog
    const dialogContent = () => {
        if (checking) return 'Checking if graph exists...';
        if (graphInfo?.error) return `Error checking graph: ${graphInfo.error}`;
        if (graphInfo) {
            return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Endpoint:</strong> {graphInfo.endpoint}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Graph URI:</strong> {graphInfo.graphUri}
                    </Typography>
                    
                    <Box sx={{ mt: 1 }}>
                        {graphInfo.exists ? (
                            <Typography variant="body2" color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                ⚠️ <strong>WARNING: This graph already exists and will be overwritten!</strong>
                            </Typography>
                        ) : (
                            <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                ✅ A new graph will be created.
                            </Typography>
                        )}
                    </Box>
                    
                    <Box sx={{ mt: 1 }}>
                        {graphInfo.hasAuth ? (
                            <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                🔐 Authentication configured and ready.
                            </Typography>
                        ) : (
                            <Typography variant="body2" color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                ⚠️ No authentication configured. This may fail if the endpoint requires credentials.
                            </Typography>
                        )}
                    </Box>
                </Box>
            );
        }
        return 'Ready to sync';
    };

    const confirmDisabled = checking || !!graphInfo?.error;

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ 
                height: '100vh', 
                display: 'flex', 
                flexDirection: 'column'
            }}>
                {/* No progress bar during sync checking */}
                
                {/* App content */}
                <Box sx={{ 
                    display: 'flex', 
                    flex: '1 1 auto', 
                    overflow: 'hidden',
                    width: '100%',
                    minHeight: '300px'
                }}>
                    <RouterProvider>
                        {/* Loading screen */}
                        {isLoading ? (
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '100%',
                                width: '100%',
                                flexDirection: 'column',
                                gap: 2
                            }}>
                                <CircularProgress size={40} />
                                <Typography variant="h6">Loading LiPD dataset...</Typography>
                                {loadingMessage && (
                                    <Typography variant="body2" color="textSecondary">
                                        {loadingMessage}
                                    </Typography>
                                )}
                            </Box>
                        ) : dataset ? (
                            /* Main application with dataset */
                            <Box sx={{ 
                                display: 'flex', 
                                width: '100%',
                                height: '100%',
                                overflow: 'hidden',
                                flexDirection: 'column'
                            }}>
                                {/* Header */}
                                <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                    <Toolbar variant="dense" sx={{ minHeight: 48, px: 2, display: 'flex', alignItems: 'center' }}>
                                        <Box sx={{ 
                                            flex: '1 1 auto', 
                                            minWidth: 0, 
                                            maxWidth: 'calc(100% - 200px)', // Reserve space for action icons
                                            overflow: 'hidden' 
                                        }}>
                                            <AppBarBreadcrumbs />
                                        </Box>
                                        <CustomAppBarActions />
                                    </Toolbar>
                                </AppBar>

                                {/* Main area */}
                                <Box sx={{ 
                                    display: 'flex', 
                                    flex: '1 1 auto',
                                    overflow: 'hidden'
                                }}>
                                    {/* Left panel - Navigation */}
                                    {navPanelOpen && (
                                        <Box sx={{ 
                                            width: '260px',
                                            minWidth: '260px',
                                            maxWidth: '260px',
                                            height: '100%',
                                            flexShrink: 0, 
                                            borderRight: 1, 
                                            borderColor: 'divider', 
                                            bgcolor: 'background.paper', 
                                            overflow: 'auto'
                                        }}>
                                            <NavigationPanel />
                                        </Box>
                                    )}

                                    {/* Right panel - Content */}
                                    <Box sx={{ 
                                        flex: '1 1 auto',
                                        minWidth: 0,
                                        height: '100%',
                                        overflow: 'auto', 
                                        p: 3
                                    }}>
                                        <EditorPanel />
                                    </Box>
                                </Box>
                            </Box>
                        ) : (
                            /* No dataset loaded */
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '100%',
                                width: '100%'
                            }}>
                                <Typography variant="h6">No dataset loaded</Typography>
                            </Box>
                        )}
                    </RouterProvider>
                </Box>

                {/* Notification snackbar */}
                <Snackbar
                    open={!!notification}
                    autoHideDuration={4000}
                    onClose={() => useLiPDStore.getState().setError(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert 
                        severity={notification?.type as any} 
                        onClose={() => useLiPDStore.getState().setError(null)}
                    >
                        {notification?.message}
                    </Alert>
                </Snackbar>

                {/* Sync Confirmation Dialog */}
                <Dialog
                    open={syncConfirmDialogOpen}
                    onClose={handleSyncCancel}
                    aria-labelledby="sync-dialog-title"
                    aria-describedby="sync-dialog-description"
                >
                    <DialogTitle id="sync-dialog-title">Sync to GraphDB</DialogTitle>
                    <DialogContent>
                        <Box id="sync-dialog-description">
                            {dialogContent()}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleSyncCancel} color="primary">
                            Cancel
                        </Button>
                        <Button onClick={handleSyncConfirm} color="primary" variant="contained" startIcon={<SyncIcon />}>
                            Sync
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </ThemeProvider>
    );
};

export default App; 