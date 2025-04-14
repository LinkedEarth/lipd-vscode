import React from 'react';
import { 
    Grid, 
    Box, 
} from '@mui/material';
import { Schema, SchemaField } from '../schemas';

import { useLiPDStore } from '../store';
import { Location } from 'lipdjs';
import LocationEditor from './LocationEditor';
import { getValueFromPath } from '../../utils/utils';
import { EditorProps } from '../router';
import { DefaultListEditor } from './DefaultListEditor';
import { DefaultEnumEditor } from './DefaultEnumEditor';
import { FormTextField } from './FormTextField';
import { Fieldset } from './Fieldset';


export const DefaultEditor: React.FC<EditorProps> = ({ path, params, onUpdate, schema, columns = 1, dense = false, title = '' }) => {
    const dataset = useLiPDStore(state => state.dataset);

    // Check if dataset exists
    if (!dataset) return null;

    const renderField = (fieldName: string, fieldSchema: SchemaField, path: string = fieldName) => {
        // Skip internal fields
        if (fieldName.startsWith('_')) return null;
        
        // Get the value from the dataset using the current path
        const value = getValueFromPath(dataset, path);
        console.log('renderField:', fieldName, path, value);

        // Special case for location
        if (fieldName === 'location' && value && typeof value === 'object') {
            const location = value;
            return (
                <Fieldset legend="Location">
                    <LocationEditor
                        latitude={location.latitude}
                        longitude={location.longitude}
                        onUpdate={(field, newValue) => {
                            const updatedLocation = { ...location };
                            updatedLocation[field] = newValue;
                            const updatedObject = Location.fromDictionary(updatedLocation);
                            onUpdate(path, updatedObject);
                        }}
                    />
                </Fieldset>
            );
        }

        if (fieldSchema.type === 'enum') {
            return (
                <DefaultEnumEditor
                    path={path}
                    params={params}
                    onUpdate={onUpdate}
                    schema={schema}
                    fieldSchema={fieldSchema}
                />
            )
        }

        if (fieldSchema.type === 'string' || fieldSchema.type === 'number') {
            return (
                <FormTextField 
                    label={fieldSchema.label || fieldName}
                    defaultValue={value || ''}
                    type={fieldSchema.type}
                    multiline={fieldSchema.multiline}
                    rows={fieldSchema.rows}
                    onBlur={(newValue) => onUpdate(path, newValue)}
                />
            );
        }

        if (fieldSchema.type === 'object' && fieldSchema.schema) {
            const nestedObject = value;
            if (!nestedObject) return null;

            return (
                <Fieldset legend={fieldSchema.label || fieldName}>
                    <DefaultEditor
                        path={path}
                        params={params}
                        onUpdate={onUpdate}
                        schema={fieldSchema.schema as Schema}
                        columns={columns}
                        dense={dense}
                    />
                </Fieldset>
            );
        }

        if (fieldSchema.type === 'array' && fieldSchema.items) {
            // console.log('arrayValue:', fieldName, arrayValue);
            // console.log('schema:', fieldSchema.items.schema);
            return (
                <DefaultListEditor
                    schema={fieldSchema.items.schema as Schema}
                    title={fieldSchema.label || fieldName}
                    onUpdate={onUpdate}
                    path={path}
                    dense={true}
                />
            )
        }
        return null;
    };

    return (
        <Box sx={{ width: '100%', padding: dense ? 0 : 2 }}>
            <Grid container alignItems="flex-start" spacing={2} sx={{ width: '100%' }}>
                {Object.entries(schema?.fields || {}).map(([fieldName, fieldSchema]) => (
                    <Grid item xs={12} md={12/columns} key={fieldName}>
                        {renderField(fieldName, fieldSchema as SchemaField, path ? `${path}.${fieldName}` : fieldName)}
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};