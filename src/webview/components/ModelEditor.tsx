import React from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import { Model, DataTable } from 'lipdjs';
import AutoForm from './AutoForm';
import ListView from './ListView';
import { useLiPDStore } from '../store';

interface ModelEditorProps {
    model: Model;
    onUpdate: (updatedModel: Model) => void;
}

const ModelEditor: React.FC<ModelEditorProps> = ({ model, onUpdate }) => {
    const setSelectedNode = useLiPDStore(state => state.setSelectedNode);
    const selectedNode = useLiPDStore(state => state.selectedNode);

    const ensembleTables = model.getEnsembleTables() || [];
    const summaryTables = model.getSummaryTables() || [];
    const distributionTables = model.getDistributionTables() || [];

    const handleAddTable = (tableType: 'ensemble' | 'summary' | 'distribution') => {
        const newTable = new DataTable();
        let updatedTables: DataTable[];
        let setter: (tables: DataTable[]) => void;
        let path: string;

        switch (tableType) {
            case 'ensemble':
                updatedTables = [...ensembleTables, newTable];
                setter = model.setEnsembleTables.bind(model);
                path = 'ensembleTables';
                break;
            case 'summary':
                updatedTables = [...summaryTables, newTable];
                setter = model.setSummaryTables.bind(model);
                path = 'summaryTables';
                break;
            case 'distribution':
                updatedTables = [...distributionTables, newTable];
                setter = model.setDistributionTables.bind(model);
                path = 'distributionTables';
                break;
        }

        setter(updatedTables);
        onUpdate(model);
        setSelectedNode(`model.${path}.${updatedTables.length - 1}`);
    };

    const handleEditTable = (tableType: 'ensemble' | 'summary' | 'distribution', index: number) => {
        const path = `${tableType}Tables`;
    };

    const handleDeleteTable = (tableType: 'ensemble' | 'summary' | 'distribution', index: number) => {
        let updatedTables: DataTable[];
        let setter: (tables: DataTable[]) => void;

        switch (tableType) {
            case 'ensemble':
                updatedTables = [...ensembleTables];
                updatedTables.splice(index, 1);
                setter = model.setEnsembleTables.bind(model);
                break;
            case 'summary':
                updatedTables = [...summaryTables];
                updatedTables.splice(index, 1);
                setter = model.setSummaryTables.bind(model);
                break;
            case 'distribution':
                updatedTables = [...distributionTables];
                updatedTables.splice(index, 1);
                setter = model.setDistributionTables.bind(model);
                break;
        }

        setter(updatedTables);
        onUpdate(model);
    };

    return (
        <Box sx={{ p: 1 }}>
            <Box sx={{ mb: 2 }}>
                <AutoForm
                    object={model}
                    onUpdate={(path, value) => {
                        if (path === 'code') {
                            model.setCode(value);
                        }
                        onUpdate(model);
                    }}
                    columns={1}
                />
            </Box>

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <ListView
                        title="Ensemble Tables"
                        items={ensembleTables.map((table, index) => ({
                            primary: table.getFileName() || `Ensemble Table ${index + 1}`,
                            secondary: `${table.getVariables()?.length || 0} variables`
                        }))}
                        onAdd={() => handleAddTable('ensemble')}
                        onEdit={(index) => handleEditTable('ensemble', index)}
                        onDelete={(index) => handleDeleteTable('ensemble', index)}
                        addButtonText="Add Ensemble Table"
                        pathPrefix={`${selectedNode}.ensembleTables`}
                        dense
                    />

                    <ListView
                        title="Distribution Tables"
                        items={distributionTables.map((table, index) => ({
                            primary: table.getFileName() || `Distribution Table ${index + 1}`,
                            secondary: `${table.getVariables()?.length || 0} variables`
                        }))}
                        onAdd={() => handleAddTable('distribution')}
                        onEdit={(index) => handleEditTable('distribution', index)}
                        onDelete={(index) => handleDeleteTable('distribution', index)}
                        addButtonText="Add Distribution Table"
                        pathPrefix={`${selectedNode}.distributionTables`}
                        dense
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <ListView
                        title="Summary Tables"
                        items={summaryTables.map((table, index) => ({
                            primary: table.getFileName() || `Summary Table ${index + 1}`,
                            secondary: `${table.getVariables()?.length || 0} variables`
                        }))}
                        onAdd={() => handleAddTable('summary')}
                        onEdit={(index) => handleEditTable('summary', index)}
                        onDelete={(index) => handleDeleteTable('summary', index)}
                        addButtonText="Add Summary Table"
                        pathPrefix={`${selectedNode}.summaryTables`}
                        dense
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default ModelEditor; 