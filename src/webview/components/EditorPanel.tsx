import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Dataset, DataTable } from 'lipdjs';
import { useLiPDStore } from '../store';
import DatasetEditor from './DatasetEditor';
import { PaleoDataEditor, PaleoDataListView } from './PaleoDataEditor';
import { ChronDataEditor, ChronDataListView } from './ChronDataEditor';
import { PublicationEditor, PublicationListView } from './PublicationEditor';
import DataTableEditor from './DataTableEditor';
import NavigationBreadcrumbs from './Breadcrumbs';
import ModelEditor from './ModelEditor';
import VariableEditor from './VariableEditor';

const EditorPanel: React.FC = () => {
    const dataset = useLiPDStore(state => state.dataset);
    const selectedNode = useLiPDStore(state => state.selectedNode);
    const updateDataset = useLiPDStore(state => state.updateDataset);
    const isLoading = useLiPDStore(state => state.isLoading);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!dataset) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    // Convert dataset to proper instance if needed
    let currentDataset = dataset;
    if (!(currentDataset instanceof Dataset)) {
        currentDataset = Dataset.fromDictionary(currentDataset);
    }

    // Get the active object and determine the view type
    const getEditorContent = () => {
        if (!selectedNode) return null;

        const parts = selectedNode.split('.');

        // Dataset root - show basic properties
        if (selectedNode === 'dataset') {
            return <DatasetEditor dataset={currentDataset} updateDataset={updateDataset} />;
        }

        // PaleoData list view
        if (selectedNode === 'paleoData') {
            return <PaleoDataListView dataset={currentDataset} updateDataset={updateDataset} />;
        }

        // Single PaleoData view
        if (parts[0] === 'paleoData' && parts.length === 2) {
            const paleoIndex = parseInt(parts[1]);
            const paleoData = currentDataset.getPaleoData()[paleoIndex];
            return (
                <PaleoDataEditor
                    paleoData={paleoData}
                    index={paleoIndex}
                    updateDataset={updateDataset}
                />
            );
        }

        // PaleoData measurement table view
        if (parts[0] === 'paleoData' && parts.length === 4 && parts[2] === 'measurementTables') {
            const paleoIndex = parseInt(parts[1]);
            const tableIndex = parseInt(parts[3]);
            const table = currentDataset.getPaleoData()[paleoIndex].getMeasurementTables()[tableIndex];
            return (
                <DataTableEditor
                    table={table}
                    onUpdate={(updatedTable) => {
                        const paleoData = currentDataset.getPaleoData()[paleoIndex];
                        const tables = paleoData.getMeasurementTables();
                        tables[tableIndex] = updatedTable;
                        paleoData.setMeasurementTables(tables);
                        updateDataset(`paleoData.${paleoIndex}.measurementTables`, tables);
                    }}
                />
            );
        }

        // Variable view
        if (parts.includes('variables')) {
            const variableIndex = parseInt(parts[parts.length - 1]);
            const tablePath = parts.slice(0, -2).join('.');
            
            // Get the table based on the path
            let table;
            if (parts[0] === 'paleoData') {
                const paleoIndex = parseInt(parts[1]);
                const tableIndex = parseInt(parts[3]);
                table = currentDataset.getPaleoData()[paleoIndex].getMeasurementTables()[tableIndex];
            } else if (parts[0] === 'chronData') {
                const chronIndex = parseInt(parts[1]);
                const tableIndex = parseInt(parts[3]);
                table = currentDataset.getChronData()[chronIndex].getMeasurementTables()[tableIndex];
            }

            if (table) {
                const variable = table.getVariables()[variableIndex];
                return (
                    <VariableEditor
                        variable={variable}
                        onUpdate={(updatedVariable) => {
                            const variables = table.getVariables();
                            variables[variableIndex] = updatedVariable;
                            table.setVariables(variables);
                            updateDataset(tablePath, table);
                        }}
                    />
                );
            }
        }

        // PaleoData model view
        if (parts[0] === 'paleoData' && parts.length === 4 && parts[2] === 'modeledBy') {
            const paleoIndex = parseInt(parts[1]);
            const modelIndex = parseInt(parts[3]);
            const model = currentDataset.getPaleoData()[paleoIndex].getModeledBy()[modelIndex];
            return (
                <ModelEditor
                    model={model}
                    onUpdate={(updatedModel) => {
                        const paleoData = currentDataset.getPaleoData()[paleoIndex];
                        const models = paleoData.getModeledBy();
                        models[modelIndex] = updatedModel;
                        paleoData.setModeledBy(models);
                        updateDataset(`paleoData.${paleoIndex}.modeledBy`, models);
                    }}
                />
            );
        }

        // Model table view
        if (parts.includes('ensembleTables') || parts.includes('summaryTables') || parts.includes('distributionTables')) {
            // Get the table type from the path
            const tableType = parts.find(part => part.includes('Tables'))?.replace('Tables', '') as 'ensemble' | 'summary' | 'distribution';
            if (!tableType) return null;

            // Get the table index (it's the last part of the path)
            const tableIndex = parseInt(parts[parts.length - 1]);
            
            // Find the model path by getting everything before the tableType
            const modelPathParts = parts.slice(0, parts.indexOf(`${tableType}Tables`));
            
            // Get the model based on the path
            let model;
            if (modelPathParts[0] === 'paleoData') {
                const paleoIndex = parseInt(modelPathParts[1]);
                const modelIndex = parseInt(modelPathParts[3]); // modeledBy index
                model = currentDataset.getPaleoData()?.[paleoIndex]?.getModeledBy()?.[modelIndex];
            } else if (modelPathParts[0] === 'chronData') {
                const chronIndex = parseInt(modelPathParts[1]);
                const modelIndex = parseInt(modelPathParts[3]); // modeledBy index
                model = currentDataset.getChronData()?.[chronIndex]?.getModeledBy()?.[modelIndex];
            }

            if (!model) return null;

            // Get the table based on the type
            let table;
            if (tableType === 'ensemble') {
                table = model.getEnsembleTables()?.[tableIndex];
            } else if (tableType === 'summary') {
                table = model.getSummaryTables()?.[tableIndex];
            } else if (tableType === 'distribution') {
                table = model.getDistributionTables()?.[tableIndex];
            }

            if (table) {
                return (
                    <DataTableEditor
                        table={table}
                        onUpdate={(updatedTable) => {
                            let tables;
                            if (tableType === 'ensemble') {
                                tables = model.getEnsembleTables();
                                tables[tableIndex] = updatedTable;
                                model.setEnsembleTables(tables);
                            } else if (tableType === 'summary') {
                                tables = model.getSummaryTables();
                                tables[tableIndex] = updatedTable;
                                model.setSummaryTables(tables);
                            } else if (tableType === 'distribution') {
                                tables = model.getDistributionTables();
                                tables[tableIndex] = updatedTable;
                                model.setDistributionTables(tables);
                            }
                            // Update using the full path to the tables
                            const modelPath = modelPathParts.join('.');
                            updateDataset(`${modelPath}.${tableType}Tables`, tables);
                        }}
                    />
                );
            }
        }

        // ChronData list view
        if (selectedNode === 'chronData') {
            return <ChronDataListView dataset={currentDataset} updateDataset={updateDataset} />;
        }

        // Single ChronData view
        if (parts[0] === 'chronData' && parts.length === 2) {
            const chronIndex = parseInt(parts[1]);
            const chronData = currentDataset.getChronData()[chronIndex];
            return (
                <ChronDataEditor
                    chronData={chronData}
                    index={chronIndex}
                    updateDataset={updateDataset}
                />
            );
        }

        // ChronData measurement table view
        if (parts[0] === 'chronData' && parts.length === 4 && parts[2] === 'measurementTables') {
            const chronIndex = parseInt(parts[1]);
            const tableIndex = parseInt(parts[3]);
            const table = currentDataset.getChronData()[chronIndex].getMeasurementTables()[tableIndex];
            return (
                <DataTableEditor
                    table={table}
                    onUpdate={(updatedTable) => {
                        const chronData = currentDataset.getChronData()[chronIndex];
                        const tables = chronData.getMeasurementTables();
                        tables[tableIndex] = updatedTable;
                        chronData.setMeasurementTables(tables);
                        updateDataset(`chronData.${chronIndex}.measurementTables`, tables);
                    }}
                />
            );
        }

        // ChronData model view
        if (parts[0] === 'chronData' && parts.length === 4 && parts[2] === 'modeledBy') {
            const chronIndex = parseInt(parts[1]);
            const modelIndex = parseInt(parts[3]);
            const model = currentDataset.getChronData()[chronIndex].getModeledBy()[modelIndex];
            return (
                <ModelEditor
                    model={model}
                    onUpdate={(updatedModel) => {
                        const chronData = currentDataset.getChronData()[chronIndex];
                        const models = chronData.getModeledBy();
                        models[modelIndex] = updatedModel;
                        chronData.setModeledBy(models);
                        updateDataset(`chronData.${chronIndex}.modeledBy`, models);
                    }}
                />
            );
        }

        // Publications list view
        if (selectedNode === 'publications') {
            return <PublicationListView dataset={currentDataset} updateDataset={updateDataset} />;
        }

        // Single Publication view
        if (parts[0] === 'publications' && parts.length === 2) {
            const pubIndex = parseInt(parts[1]);
            const publication = currentDataset.getPublications()[pubIndex];
            return (
                <PublicationEditor
                    publication={publication}
                    index={pubIndex}
                    updateDataset={updateDataset}
                />
            );
        }

        return null;
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <NavigationBreadcrumbs dataset={currentDataset} activeNode={selectedNode} />
            <Box sx={{ flex: 1, overflow: 'auto' }}>
                {getEditorContent()}
            </Box>
        </Box>
    );
};

export default EditorPanel;