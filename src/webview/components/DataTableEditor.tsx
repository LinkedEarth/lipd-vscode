import React from 'react';
import { Box, Paper, Typography, Grid, TextField, IconButton, Button } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Dataset, Variable } from 'lipdjs';
import { useLiPDStore } from '../store';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ListView from './ListView';

interface DataTableEditorProps {
    dataset?: Dataset;
    table: any;
    onUpdate: (updatedTable: any) => void;
}

const DataTableEditor: React.FC<DataTableEditorProps> = ({ dataset, table, onUpdate }) => {
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const selectedNode = useLiPDStore(state => state.selectedNode);
    const setSelectedNode = useLiPDStore(state => state.setSelectedNode);

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
        onUpdate(table);
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
        onUpdate(table);
    };

    const handleAddVariable = () => {
        const newVariable = new Variable();
        const updatedVariables = [...variables, newVariable];
        table.setVariables(updatedVariables);
        onUpdate(table);
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
        onUpdate(table);
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
                    <IconButton size="small" onClick={() => handleDeleteRow(params.row)}>
                        <DeleteIcon />
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
                <Typography variant="h6">Data Table</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon sx={{fontSize: 18}}/>}
                    size="small"
                    onClick={handleAddRow}
                >
                    Add Row
                </Button>
            </Box>

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="File Name"
                        value={table.getFileName() || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            table.setFileName(e.target.value);
                            onUpdate(table);
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
                            onUpdate(table);
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
                items={variables.map((variable: any) => ({
                    primary: variable.getName() || 'Unnamed Variable',
                    secondary: `Type: ${variable.getVariableType() || 'Not specified'}`
                }))}
                onAdd={handleAddVariable}
                onEdit={handleEditVariable}
                onDelete={handleDeleteVariable}
                addButtonText="Add Variable"
                pathPrefix={`${selectedNode}.variables`}
            />
        </Box>
    );
};

export default DataTableEditor; 