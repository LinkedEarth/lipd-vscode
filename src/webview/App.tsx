import React, { useEffect } from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme, Alert, Snackbar } from '@mui/material';
import { Dataset } from 'lipdjs';
import { VSCodeMessage } from './types';
import { useLiPDStore } from './store';
import NavigationPanel from './components/NavigationPanel';
import EditorPanel from './components/EditorPanel';


// Create theme
const theme = createTheme({
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
        MuiTreeItem: {
            styleOverrides: {
                root: {
                    padding: '2px 0',
                    '& .MuiTreeItem-content': {
                        padding: '2px 8px',
                        borderRadius: 4,
                    },
                    '& .MuiTreeItem-iconContainer': {
                        marginRight: 4,
                    }
                }
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    padding: 16,
                }
            }
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    padding: '8px 16px',
                    fontSize: '0.8125rem',
                }
            }
        }
    }
});

// Handle messages from VS Code extension
window.addEventListener('message', (event: MessageEvent) => {
    const message = event.data as VSCodeMessage;
    console.log('Received message from VS Code:', message);
    
    switch (message.type) {
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
                } catch (error) {
                    console.error('Error parsing dataset:', error);
                    useLiPDStore.getState().setError('Failed to parse dataset data');
                }
            }
            break;
            
        case 'error':
            // Handle error messages
            if (message.error) {
                useLiPDStore.getState().setError(message.error as string);
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
    }
});

const App: React.FC = () => {
    const dataset = useLiPDStore((state: any) => state.dataset);
    const notification = useLiPDStore((state: any) => state.notification);
    const rightPanelOpen = useLiPDStore((state: any) => state.rightPanelOpen);
    const initialize = useLiPDStore((state: any) => state.initialize);

    // Initialize the store when the app mounts
    useEffect(() => {
        initialize();
    }, [initialize]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ 
                display: 'flex', 
                height: '100vh',
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