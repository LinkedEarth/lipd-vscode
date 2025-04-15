import React, { useEffect, useMemo } from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme, Alert, Snackbar, AppBar, Toolbar, Typography } from '@mui/material';
import { Dataset } from 'lipdjs';
import { VSCodeMessage, ThemeMode } from './types';
import { useLiPDStore } from './store';
import NavigationPanel from './components/NavigationPanel';
import { EditorPanel } from './components/EditorPanel';
import AppBarBreadcrumbs from './components/AppBarBreadcrumbs';
import { RouterProvider } from './router';

// Set up initialTheme from window if available
declare global {
    interface Window {
        initialTheme?: ThemeMode;
    }
}

// Handle messages from VS Code extension
window.addEventListener('message', (event: MessageEvent) => {
    const message = event.data as VSCodeMessage;
    console.log('Received message from VS Code:', message);
    
    switch (message.type) {
        case 'ready':
            // Set loading state to true
            useLiPDStore.getState().setIsLoading(true);
            break;
            
        case 'datasetLoaded':
            // Initialize dataset with data from VS Code
            if (message.data) {
                try {
                    // Parse the JSON string if it's a string
                    const datasetData = typeof message.data.data === 'string' 
                        ? JSON.parse(message.data.data) 
                        : message.data.data;
                    
                    // Convert the plain object to a Dataset instance
                    const dataset = Dataset.fromData(message.data.id, datasetData);
                    useLiPDStore.getState().setDataset(dataset);
                    // Set loading state to false
                    useLiPDStore.getState().setIsLoading(false);
                } catch (error) {
                    console.error('Error parsing dataset:', error);
                    useLiPDStore.getState().setError('Failed to parse dataset data');
                    // Set loading state to false even if there's an error
                    useLiPDStore.getState().setIsLoading(false);
                }
            } else {
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
    }
});

const App: React.FC = () => {
    const dataset = useLiPDStore((state: any) => state.dataset);
    const notification = useLiPDStore((state: any) => state.notification);
    const rightPanelOpen = useLiPDStore((state: any) => state.rightPanelOpen);
    const initialize = useLiPDStore((state: any) => state.initialize);
    const selectedNode = useLiPDStore((state: any) => state.selectedNode);
    const themeMode = useLiPDStore((state: any) => state.themeMode);
    
    // Initialize the store when the app mounts and set the initial theme if available
    useEffect(() => {
        // Set initial theme from window if available
        if (window.initialTheme) {
            useLiPDStore.getState().setThemeMode(window.initialTheme);
        }
        
        // Initialize the store
        initialize();
    }, [initialize]);

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
                            <NavigationPanel dataset={dataset} />
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
                    open={true} 
                    autoHideDuration={6000}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert severity={notification.type} sx={{ width: '100%' }}>
                        {notification.message}
                    </Alert>
                </Snackbar>
            )}
        </ThemeProvider>
    );
};

export default App; 