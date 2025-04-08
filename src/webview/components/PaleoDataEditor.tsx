import React from 'react';
import { Box, List, ListItem, ListItemText, Divider, IconButton, Typography, Button } from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { PaleoData, Dataset, DataTable, Model } from 'lipdjs';
import { AppState } from '../types';
import AutoForm from './AutoForm';
import { useLiPDStore } from '../store';
import ListView from './ListView';

interface PaleoDataEditorProps {
    paleoData: PaleoData;
    index: number;
    updateDataset: AppState['updateDataset'];
}

const PaleoDataEditor: React.FC<PaleoDataEditorProps> = ({ paleoData, index, updateDataset }) => {
    const selectedNode = useLiPDStore(state => state.selectedNode);
    const setSelectedNode = useLiPDStore(state => state.setSelectedNode);

    const measurementTables = paleoData.getMeasurementTables() || [];
    const models = paleoData.getModeledBy() || [];

    const handleAddTable = () => {
        const newTable = new DataTable();
        const updatedTables = [...measurementTables, newTable];
        paleoData.setMeasurementTables(updatedTables);
        updateDataset(`paleoData.${index}.measurementTables`, updatedTables);
        setSelectedNode(`paleoData.${index}.measurementTables.${measurementTables.length}`);
    };

    const handleEditTable = (tableIndex: number) => {
        setSelectedNode(`paleoData.${index}.measurementTables.${tableIndex}`);
    };

    const handleDeleteTable = (tableIndex: number) => {
        const updatedTables = [...measurementTables];
        updatedTables.splice(tableIndex, 1);
        paleoData.setMeasurementTables(updatedTables);
        updateDataset(`paleoData.${index}.measurementTables`, updatedTables);
    };

    const handleAddModel = () => {
        const newModel = new Model();
        const updatedModels = [...models, newModel];
        paleoData.setModeledBy(updatedModels);
        updateDataset(`paleoData.${index}.modeledBy`, updatedModels);
        setSelectedNode(`paleoData.${index}.modeledBy.${models.length}`);
    };

    const handleEditModel = (modelIndex: number) => {
        setSelectedNode(`paleoData.${index}.modeledBy.${modelIndex}`);
    };

    const handleDeleteModel = (modelIndex: number) => {
        const updatedModels = [...models];
        updatedModels.splice(modelIndex, 1);
        paleoData.setModeledBy(updatedModels);
        updateDataset(`paleoData.${index}.modeledBy`, updatedModels);
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 4 }}>
                <AutoForm
                    object={paleoData}
                    onUpdate={(path, value) => {
                        updateDataset(`paleoData.${index}.${path}`, value);
                    }}
                    pathPrefix={`paleoData.${index}`}
                    columns={1}
                />
            </Box>

            <ListView
                title="Measurement Tables"
                items={measurementTables.map((table, index) => ({
                    primary: table.getFileName() || `Table ${index + 1}`,
                    secondary: `${table.getVariables()?.length || 0} variables`
                }))}
                onAdd={handleAddTable}
                onEdit={handleEditTable}
                onDelete={handleDeleteTable}
                addButtonText="Add Table"
            />

            <Box sx={{ mt: 4 }}>
                <ListView
                    title="Models"
                    items={models.map((model, index) => ({
                        primary: `Model ${index + 1}`,
                        secondary: `
                            ${model.getEnsembleTables().length} ensemble tables,
                            ${model.getSummaryTables().length} summary tables,
                            ${model.getDistributionTables().length} distribution tables
                        `
                    }))}
                    onAdd={handleAddModel}
                    onEdit={handleEditModel}
                    onDelete={handleDeleteModel}
                    addButtonText="Add Model"
                />
            </Box>
        </Box>
    );
};

interface PaleoDataListViewProps {
    dataset: Dataset;
    updateDataset: AppState['updateDataset'];
}

const PaleoDataListView: React.FC<PaleoDataListViewProps> = ({ dataset, updateDataset }) => {
    const setSelectedNode = useLiPDStore(state => state.setSelectedNode);

    const paleoData = dataset.getPaleoData() || [];

    const handleAdd = () => {
        const newPaleoData = new PaleoData();
        const updatedPaleoData = [...paleoData, newPaleoData];
        updateDataset('paleoData', updatedPaleoData);
        setSelectedNode(`paleoData.${paleoData.length}`);
    };

    const handleEdit = (index: number) => {
        setSelectedNode(`paleoData.${index}`);
    };

    const handleDelete = (index: number) => {
        const updatedPaleoData = [...paleoData];
        updatedPaleoData.splice(index, 1);
        updateDataset('paleoData', updatedPaleoData);
    };

    return (
        <Box sx={{ p: 2 }}>
            <ListView
                title="PaleoData Records"
                items={paleoData.map((item, index) => ({
                    primary: item.getName() || `PaleoData ${index + 1}`,
                    secondary: `
                        ${item.getMeasurementTables()?.length || 0} measurement tables,
                        ${item.getModeledBy()?.length || 0} models
                    `
                }))}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                addButtonText="Add PaleoData"
            />
        </Box>
    );
};

export { PaleoDataEditor, PaleoDataListView }; 