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
import { getValueFromPath } from '../../utils/utils';
import { EditorProps } from '../router';

export const DataTableEditor: React.FC<EditorProps> = ({ path, params, onUpdate, title = '' }) => {
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const selectedNode = useLiPDStore(state => state.selectedNode);
    const setSelectedNode = useLiPDStore(state => state.setSelectedNode);
    const [csvDialogOpen, setCsvDialogOpen] = React.useState(false);
    const [csvContent, setCsvContent] = React.useState('');

    const dataset = useLiPDStore(state => state.dataset);
    const table = getValueFromPath(dataset, path) as any;

    const columns = table.getVariables()?.map((variable: any) => variable.getName()) || [];
    const rows = table.getDataFrame()?.data || {};
    const variables = table.getVariables() || [];

    const handleAddRow = () => {
        const newRow: any = {};
        columns.forEach((column: string) => {
            newRow[column] = '';
        });
        const updatedRows = { ...rows };
        Object.keys(updatedRows).forEach((key: string) => {
            updatedRows[key].push(newRow[key] || '');
        });
        table.setDataFrame({ data: updatedRows, metadata: table.getDataFrame()?.metadata || {} });
        onUpdate(path, table);
    };

    const handleDeleteRow = (row: any) => {
        const updatedRows = { ...rows };
        Object.keys(updatedRows).forEach((key: string) => {
            const index = updatedRows[key].indexOf(row[key]);
            if (index !== -1) {
                updatedRows[key].splice(index, 1);
            }
        });
        table.setDataFrame({ data: updatedRows, metadata: table.getDataFrame()?.metadata || {} });
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
            
            (headers as string[]).forEach((header: string) => {
                if (!existingVariableNames.includes(header)) {
                    const newVariable = new Variable();
                    newVariable.setName(header);
                    existingVariables.push(newVariable);
                }
            });
            
            table.setVariables(existingVariables);
            
            // Parse the data
            const newData: any = {};
            headers.forEach(header => {
                newData[header] = [];
            });
            
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const values = lines[i].split(',').map(value => value.trim());
                headers.forEach((header, index) => {
                    newData[header].push(values[index] || '');
                });
            }
            
            table.setDataFrame({ data: newData, metadata: table.getDataFrame()?.metadata || {} });
            onUpdate(path, table);
        };
        reader.readAsText(file);
    };

    const handleExportCSV = () => {
        const headers = columns;
        const data = gridRows;
        
        let csvContent = headers.join(',') + '\n';
        
        data.forEach(row => {
            const values = headers.map((header: string) => row[header] || '');
            csvContent += values.join(',') + '\n';
        });
        
        setCsvContent(csvContent);
        setCsvDialogOpen(true);
    };

    const gridColumns: GridColDef[] = [
        ...columns.map((column: string) => ({
            field: column,
            headerName: column,
            flex: 1,
            minWidth: 150,
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
                        onClick={(e: React.MouseEvent) => {
                            e.stopPropagation(); // Prevent the ListItem click
                            handleDeleteRow(params.row);
                        }}
                    >
                        <Delete sx={{ fontSize: 16 }} />
                    </IconButton>
                </Box>
            ),
        },
    ];

    const gridRows = Array.from({ length: Math.max(...Object.values(rows).map((arr: any) => arr.length)) }, (_, index) => {
        const row: any = { id: index };
        columns.forEach((column: string) => {
            row[column] = rows[column]?.[index] || '';
        });
        return row;
    });

    return (
        <Box sx={{ p: 2 }}>
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
                        InputProps={{
                            readOnly: true,
                            style: { 
                                fontFamily: 'monospace',
                                whiteSpace: 'pre',
                                overflowX: 'auto'
                            }
                        }}
                        variant="outlined"
                        margin="dense"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCsvDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};