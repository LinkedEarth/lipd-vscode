import React from 'react';
import { Box, Paper, Typography, Grid, TextField, IconButton, Button } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Dataset, Variable } from 'lipdjs';
import { useLiPDStore } from '../store';
import AddIcon from '@mui/icons-material/Add';
import ListView from './ListView';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import Delete from '@mui/icons-material/Delete';
import { variableSchema } from '../schemas';
import { formVariant, getValueFromPath } from '../../utils/utils';
import { EditorProps } from '../router';
import ConfirmDialog from './ConfirmDialog';

export const DataTableEditor: React.FC<EditorProps> = ({ path, params, onUpdate, title = '' }) => {
    const dataset = useLiPDStore((state: any) => state.dataset);
    
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [csvDialogOpen, setCsvDialogOpen] = React.useState(false);
    const [csvContent, setCsvContent] = React.useState('');
    
    const { selectedNode, setSelectedNode } = useLiPDStore(state => ({
        selectedNode: state.selectedNode,
        setSelectedNode: state.setSelectedNode
    }));

    const table = getValueFromPath(dataset, path) as any;
    const columns = table.getVariables() || [];
    const dataList = table.getDataList() || { data: [], metadata: [] };
    const rows = (dataList.data || []).length > 0 ? 
        (dataList.data[0] || []).map((_: any, colIndex: number) => 
            (dataList.data || []).map((row: any[]) => row[colIndex] || '')
        ) : 
        [];

    const metadata = dataList.metadata || [];
    const variables = table.getVariables() || [];

    // Add state for delete confirmation
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
    const [rowToDelete, setRowToDelete] = React.useState<number | null>(null);

    const handleAddRow = () => {
        // Create a new empty row with appropriate number of columns
        const newRow = Array(columns.length).fill('');
        
        // Add the new row to the data
        const updatedRows = [...rows, newRow];
        
        // Update the table with the new data
        table.setDataFrame({ 
            data: updatedRows, 
            metadata: metadata 
        });
        
        onUpdate(path, table);
    };

    const handleDeleteRow = (rowIndex: number) => {
        // Create a copy of the rows and remove the specified row
        const updatedRows = [...rows];
        updatedRows.splice(rowIndex, 1);
        
        // Update the table with the modified data
        table.setDataFrame({ 
            data: updatedRows, 
            metadata: metadata 
        });
        
        onUpdate(path, table);
    };

    const handleAddVariable = () => {
        const newVariable = new Variable();
        const updatedVariables = [...variables, newVariable];
        table.setVariables(updatedVariables);
        onUpdate(path, table);
        // Navigate to the new variable
        const newIndex = variables.length;
        setSelectedNode(`${selectedNode}.variables.${newIndex}`);
    };

    const handleEditVariable = (index: number) => {
        setSelectedNode(`${selectedNode}.variables.${index}`);
    };

    const handleDeleteVariable = (index: number) => {
        const updatedVariables = [...variables];
        updatedVariables.splice(index, 1);
        table.setVariables(updatedVariables);
        onUpdate(path, table);
    };

    const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const csvText = e.target?.result as string;
            const lines = csvText.split('\n');
            const headers = lines[0].split(',').map(header => header.trim());
            
            // Create variables for new columns if they don't exist
            const existingVariables = table.getVariables() || [];
            const existingVariableNames: string[] = existingVariables.map((v: Variable) => v.getName());
            
            headers.forEach((header: string) => {
                if (!existingVariableNames.includes(header)) {
                    const newVariable = new Variable();
                    newVariable.setName(header);
                    existingVariables.push(newVariable);
                }
            });
            table.setVariables(existingVariables);
            
            // Parse the data as a list of lists
            const newData: any[][] = [];
            
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const values = lines[i].split(',').map(value => value.trim());
                newData.push(values);
            }
            let metadata = table.getDataList().metadata
            table.setDataList({ data: newData, metadata: metadata });
            onUpdate(path, table);
        };
        reader.readAsText(file);
    };

    const handleExportCSV = () => {
        const headers = columns.map((column: Variable) => column.getName());
        let csvContent = headers.join(',') + '\n';
        
        // Convert rows to CSV
        rows.forEach((rowData: any[]) => {
            csvContent += rowData.join(',') + '\n';
        });
        
        setCsvContent(csvContent);
        setCsvDialogOpen(true);
    };

    const handleDeleteRowRequest = (rowIndex: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent the row click
        setRowToDelete(rowIndex);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDeleteRow = () => {
        if (rowToDelete !== null) {
            handleDeleteRow(rowToDelete);
            setDeleteConfirmOpen(false);
            setRowToDelete(null);
        }
    };

    const handleCancelDeleteRow = () => {
        setDeleteConfirmOpen(false);
        setRowToDelete(null);
    };

    const gridColumns: GridColDef[] = [
        ...columns.map((column: Variable, colIndex: number) => ({
            field: colIndex.toString(),
            headerName: column.getName(),
            flex: 1,
            minWidth: 150,
            editable: true
        })),
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            renderCell: (params) => (
                <Box>
                    <IconButton 
                        size="small" 
                        edge="end"
                        aria-label="delete"
                        onClick={(e: React.MouseEvent) => handleDeleteRowRequest(params.row.rowIndex, e)}
                    >
                        <Delete sx={{ fontSize: 16 }} />
                    </IconButton>
                </Box>
            ),
        },
    ];

    // Create grid rows from the list data
    const gridRows = rows.map((rowData: any[], rowIndex: number) => {
        const row: any = { 
            id: rowIndex,
            rowIndex: rowIndex // Store the actual row index for operations
        };
        
        // Add each column value to the row
        columns.forEach((column: Variable, colIndex: number) => {
            row[colIndex.toString()] = rowData[colIndex] || '';
        });
        
        return row;
    });

    return (
        <Box sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">{title}</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="contained"
                        startIcon={<FileUploadIcon />}
                        size="small"
                        component="label"
                    >
                        Import CSV
                        <input
                            type="file"
                            hidden
                            accept=".csv"
                            onChange={handleImportCSV}
                        />
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<FileDownloadIcon />}
                        size="small"
                        onClick={handleExportCSV}
                    >
                        Export CSV
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon sx={{fontSize: 18}}/>}
                        size="small"
                        onClick={handleAddRow}
                    >
                        Add Row
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="File Name"
                        value={table.getFileName() || ''}
                        variant={formVariant}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            table.setFileName(e.target.value);
                            onUpdate(path, table);
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Missing Value"
                        value={table.getMissingValue() || ''}
                        variant={formVariant}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            table.setMissingValue(e.target.value);
                            onUpdate(path, table);
                        }}
                    />
                </Grid>
            </Grid>

            <Box sx={{ height: 500, width: '100%', mb: 2 }}>
                <DataGrid
                    rows={gridRows}
                    columns={gridColumns}
                    initialState={{
                        pagination: {
                            paginationModel: {
                                pageSize: rowsPerPage,
                                page: page,
                            },
                        },
                    }}
                    pageSizeOptions={[5, 10, 25, 50]}
                    onPaginationModelChange={(params) => {
                        setPage(params.page);
                        setRowsPerPage(params.pageSize);
                    }}
                    disableRowSelectionOnClick
                />
            </Box>

            <ListView
                title="Variables"
                schema={variableSchema}
                items={variables}
                onAdd={handleAddVariable}
                onEdit={handleEditVariable}
                onDelete={handleDeleteVariable}
                addButtonText="Add Variable"
                pathPrefix={`${selectedNode}.variables`}
            />

            <Dialog 
                open={csvDialogOpen} 
                onClose={() => setCsvDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>CSV Data for {table.getFileName() || 'data'}.csv</DialogTitle>
                <DialogContent>
                    <TextField
                        multiline
                        fullWidth
                        value={csvContent}
                        variant="standard"
                        InputProps={{
                            readOnly: true,
                            style: { 
                                fontFamily: 'monospace',
                                whiteSpace: 'pre',
                                overflowX: 'auto'
                            }
                        }}
                        margin="dense"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCsvDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Confirmation Dialog */}
            <ConfirmDialog
                open={deleteConfirmOpen}
                title="Confirm Row Deletion"
                message="Are you sure you want to delete this row? This action cannot be undone."
                onConfirm={handleConfirmDeleteRow}
                onCancel={handleCancelDeleteRow}
            />
        </Box>
    );
};