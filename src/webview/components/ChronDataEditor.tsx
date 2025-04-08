import React from 'react';
import { Box } from '@mui/material';
import { ChronData, Dataset, DataTable, Model } from 'lipdjs';
import { AppState } from '../types';
import AutoForm from './AutoForm';
import { useLiPDStore } from '../store';
import ListView from './ListView';

interface ChronDataEditorProps {
    chronData: ChronData;
    index: number;
    updateDataset: AppState['updateDataset'];
}

const ChronDataEditor: React.FC<ChronDataEditorProps> = ({ chronData, index, updateDataset }) => {
    const selectedNode = useLiPDStore(state => state.selectedNode);
    const setSelectedNode = useLiPDStore(state => state.setSelectedNode);

    const measurementTables = chronData.getMeasurementTables() || [];
    const models = chronData.getModeledBy() || [];

    const handleAddTable = () => {
        const newTable = new DataTable();
        const updatedTables = [...measurementTables, newTable];
        chronData.setMeasurementTables(updatedTables);
        updateDataset(`chronData.${index}.measurementTables`, updatedTables);
        setSelectedNode(`chronData.${index}.measurementTables.${measurementTables.length}`);
    };

    const handleEditTable = (tableIndex: number) => {
        setSelectedNode(`chronData.${index}.measurementTables.${tableIndex}`);
    };

    const handleDeleteTable = (tableIndex: number) => {
        const updatedTables = [...measurementTables];
        updatedTables.splice(tableIndex, 1);
        chronData.setMeasurementTables(updatedTables);
        updateDataset(`chronData.${index}.measurementTables`, updatedTables);
    };

    const handleAddModel = () => {
        const newModel = new Model();
        const updatedModels = [...models, newModel];
        chronData.setModeledBy(updatedModels);
        updateDataset(`chronData.${index}.modeledBy`, updatedModels);
        setSelectedNode(`chronData.${index}.modeledBy.${models.length}`);
    };

    const handleEditModel = (modelIndex: number) => {
        setSelectedNode(`chronData.${index}.modeledBy.${modelIndex}`);
    };

    const handleDeleteModel = (modelIndex: number) => {
        const updatedModels = [...models];
        updatedModels.splice(modelIndex, 1);
        chronData.setModeledBy(updatedModels);
        updateDataset(`chronData.${index}.modeledBy`, updatedModels);
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 4 }}>
                <AutoForm
                    object={chronData}
                    onUpdate={(path, value) => {
                        updateDataset(`chronData.${index}.${path}`, value);
                    }}
                    pathPrefix={`chronData.${index}`}
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
    );
};

interface ChronDataListViewProps {
    dataset: Dataset;
    updateDataset: AppState['updateDataset'];
}

const ChronDataListView: React.FC<ChronDataListViewProps> = ({ dataset, updateDataset }) => {
    const setSelectedNode = useLiPDStore(state => state.setSelectedNode);

    const chronData = dataset.getChronData() || [];

    const handleAdd = () => {
        const newChronData = new ChronData();
        const updatedChronData = [...chronData, newChronData];
        updateDataset('chronData', updatedChronData);
        setSelectedNode(`chronData.${chronData.length}`);
    };

    const handleEdit = (index: number) => {
        setSelectedNode(`chronData.${index}`);
    };

    const handleDelete = (index: number) => {
        const updatedChronData = [...chronData];
        updatedChronData.splice(index, 1);
        updateDataset('chronData', updatedChronData);
    };

    return (
        <Box sx={{ p: 2 }}>
            <ListView
                title="ChronData Records"
                items={chronData.map((item, index) => ({
                    primary: `ChronData ${index + 1}`,
                    secondary: `
                        ${item.getMeasurementTables()?.length || 0} measurement tables,
                        ${item.getModeledBy()?.length || 0} models
                    `
                }))}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                addButtonText="Add ChronData"
            />
        </Box>
    );
};

export { ChronDataEditor, ChronDataListView }; 