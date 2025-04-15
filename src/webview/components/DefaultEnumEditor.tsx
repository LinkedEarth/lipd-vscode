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
import { getValueFromPath, formVariant } from '../../utils/utils';
import { useLiPDStore } from '../store';

export const DefaultEnumEditor: React.FC<EditorProps> = ({ path, params, onUpdate, schema, fieldSchema }) => {
    const dataset = useLiPDStore((state: any) => state.dataset);
    const value = getValueFromPath(dataset, path);
    const enumValue = value as SynonymEntry;
    if (!fieldSchema) {
        return null;
    }
            
    // Extract the value regardless of format
    let displayValue = '';
    let idValue = '';
    if (enumValue) {
        displayValue = enumValue.label;
        idValue = enumValue.id;
    }

    return (
        <FormControl variant={formVariant} sx={{ mt: 2, width: '100%' }}>
            <InputLabel>{fieldSchema.label}</InputLabel>
            <Select
                label={fieldSchema.label}
                value={idValue}
                size="small"
                margin="dense"
                variant={formVariant}
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
                    <MenuItem value={option.id}>
                        {option.label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};