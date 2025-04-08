import React from 'react';
import { Box } from '@mui/material';
import { Dataset } from 'lipdjs';
import AutoForm from './AutoForm';
import { AppState } from '../types';

interface DatasetEditorProps {
    dataset: Dataset;
    updateDataset: AppState['updateDataset'];
}

const DatasetEditor: React.FC<DatasetEditorProps> = ({ dataset, updateDataset }) => {
    return (
        <Box sx={{ p: 2 }}>
            <AutoForm
                object={dataset}
                onUpdate={(path, value) => {
                    updateDataset(path, value);
                }}
                pathPrefix="dataset"
                columns={1}
            />
        </Box>
    );
};

export default DatasetEditor; 