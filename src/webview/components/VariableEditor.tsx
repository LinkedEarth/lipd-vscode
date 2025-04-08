import React from 'react';
import { Box } from '@mui/material';
import { Variable } from 'lipdjs';
import AutoForm from './AutoForm';
import { useLiPDStore } from '../store';
import { AppState } from '../types';

interface VariableEditorProps {
    variable: Variable;
    onUpdate: (updatedVariable: Variable) => void;
}

const VariableEditor: React.FC<VariableEditorProps> = ({ variable, onUpdate }) => {
    const selectedNode = useLiPDStore((state: AppState) => state.selectedNode);
    const pathParts = selectedNode?.split('.') || [];
    const pathPrefix = pathParts.slice(0, -1).join('.');

    return (
        <Box sx={{ p: 2 }}>
            <AutoForm
                object={variable}
                onUpdate={(path, value) => {
                    // Update the variable property
                    const updatedVariable = { ...variable };
                    const pathParts = path.split('.');
                    let current: any = updatedVariable;
                    for (let i = 0; i < pathParts.length - 1; i++) {
                        if (!current[pathParts[i]]) {
                            current[pathParts[i]] = {};
                        }
                        current = current[pathParts[i]];
                    }
                    current[pathParts[pathParts.length - 1]] = value;
                    onUpdate(updatedVariable as Variable);
                }}
                pathPrefix={pathPrefix}
                columns={1}
            />
        </Box>
    );
};

export default VariableEditor; 