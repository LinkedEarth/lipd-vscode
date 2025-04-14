import React from 'react';
import {  
    Box, 
    MenuItem
} from '@mui/material';

import { SynonymEntry } from 'lipdjs';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { EditorProps } from '../router';
import { SchemaField } from '../schemas';
import { getValueFromPath } from '../../utils/utils';
import { useLiPDStore } from '../store';

interface EnumEditorProps extends EditorProps {
    fieldSchema: SchemaField;
}

export const DefaultEnumEditor: React.FC<EnumEditorProps> = ({ path, params, onUpdate, schema, fieldSchema }) => {
    
    const dataset = useLiPDStore(state => state.dataset);
    const value = getValueFromPath(dataset, path);
    const enumValue = value as SynonymEntry;
            
    // Extract the value regardless of format
    let displayValue = '';
    let idValue = '';
    if (enumValue) {
        displayValue = enumValue.label;
        idValue = enumValue.id;
    }

    return (
        <Box sx={{ mb: 1, width: '100%' }}>
        <FormControl fullWidth sx={{ width: '100%' }}>
            <InputLabel>{fieldSchema.label}</InputLabel>
            <Select
                label={fieldSchema.label}
                value={idValue}
                size="small"
                margin="dense"
                sx={{
                    '.MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        paddingY: '10px',
                        minHeight: '1.4375em'
                    }
                }}
                onChange={(event: SelectChangeEvent<string>) => {
                    let newValue = event.target.value;
                    
                    const enumValue = fieldSchema.schema?.enum?.[newValue];
                    if (enumValue) {
                        // Call .fromSynonym() on the class specified in the schema
                        const cls = fieldSchema.schema?.class;
                        if (cls) {
                            // Create class from string
                            newValue = new cls(enumValue.id, enumValue.label);
                            onUpdate(path, newValue);
                        }
                    }
                }}
            >
                {Object.values(fieldSchema.schema?.enum || {}).map((option: SynonymEntry) => (
                    <MenuItem key={option.id} value={option.id}>
                        {option.label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
        </Box>
    );
};