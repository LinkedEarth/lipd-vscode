import React from 'react';
import { 
    Box, 
} from '@mui/material';
import { Schema, SchemaField } from '../schemas';
import ListView from './ListView';
import { useLiPDStore } from '../store';
import { getValueFromPath } from '../../utils/utils';
import { EditorProps } from '../router';


export const DefaultListEditor: React.FC<EditorProps> = ({
    path,
    title = '',
    params = {},
    onUpdate,
    schema,
    columns = 1,
    dense = false
}) => {
    const setSelectedNode = useLiPDStore(state => state.setSelectedNode);
    const dataset = useLiPDStore(state => state.dataset);
    const list = getValueFromPath(dataset, path);
    console.log("Schema:", schema);

    // Check if dataset exists
    if (!dataset) return null;

    const handleEditItem = (index: number) => {
        // Set the selected node to the path of the item being edited
        const itemPath = `${path}.${index}`;
        
        onUpdate(itemPath, list[index]);
        setSelectedNode(itemPath);
    };

    const handleAddItem = () => {
        // Create a new item with default values based on the schema
        const newItem = createDefaultItem(schema, undefined);
        
        // Create a new array with the new item
        const newList = [...list, newItem];
        
        // Update the dataset
        onUpdate(path, newList);
        
        // Navigate to the new item's editor
        const newIndex = newList.length - 1;
        const newItemPath = `${path}.${newIndex}`;
        setSelectedNode(newItemPath);
    };

    // Helper function to create a default item based on schema
    const createDefaultItem = (objectSchema: Schema | undefined, fieldSchema: SchemaField | undefined): any => {
        console.log("Creating default item for objectSchema:", objectSchema, "and fieldSchema:", fieldSchema);
        if (objectSchema) {
            // This is a Top level schema object
            const obj: any = new objectSchema.class();
            Object.entries(objectSchema.fields || {}).forEach(([key, propSchema]) => {
                obj[key] = createDefaultItem(propSchema.schema, propSchema);
            });
            return obj;
        }
        else if (fieldSchema) {
            // This is a SchemaField
            if (fieldSchema.type === 'object' && fieldSchema.schema) {
                const obj: any = new fieldSchema.schema.class();
                Object.entries(fieldSchema.schema.fields || {}).forEach(([key, propSchema]) => {
                    obj[key] = createDefaultItem(propSchema.schema, propSchema);
                });
                return obj;
            }
            return getDefaultValueForType(fieldSchema);            
        }
        else {
            return {};
        }
    };

    // Helper function to get default value based on type
    const getDefaultValueForType = (schema: SchemaField): any => {
        switch (schema.type) {
            case 'string':
                return '';
            case 'number':
                return 0;
            case 'boolean':
                return false;
            case 'array':
                return [];
            case 'object':
                return {};
            default:
                return null;
        }
    };

    const handleDeleteItem = (index: number) => {        
        // Create a new array without the deleted item
        const newList = [...list];
        newList.splice(index, 1);
        
        // Update the dataset
        onUpdate(path, newList);
    };

    return (
        <Box sx={{ 
            width: '100%',
            p: dense ? 0 : 2
        }}>
            <ListView
                schema={schema as Schema}
                title={title}
                items={list}
                onAdd={() => handleAddItem()}
                onEdit={(index) => handleEditItem(index)}
                onDelete={(index) => handleDeleteItem(index)}
                addButtonText="Add"
                pathPrefix={path}
            />
        </Box>
    );
};