import React from 'react';
import { 
    Box, 
} from '@mui/material';
import { Schema, SchemaField } from '../schemas';
import ListView from './ListView';
import { useLiPDStore } from '../store';
import { getValueFromPath, createDefaultItem } from '../../utils/utils';
import { EditorProps } from '../router';


export const DefaultListEditor: React.FC<EditorProps> = ({
    dataset,
    path,
    title = '',
    params = {},
    onUpdate,
    schema,
    columns = 1,
    dense = true,
    fieldSchema = {} as SchemaField
}) => {
    const setSelectedNode = useLiPDStore(state => state.setSelectedNode);
    const list = getValueFromPath(dataset, path);

    // console.log("Path:", path);
    // console.log("List:", list);
    // console.log("Schema:", schema);

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

    const handleDeleteItem = (index: number) => {        
        // Create a new array without the deleted item
        const newList = [...list];
        newList.splice(index, 1);
        
        // Update the dataset
        onUpdate(path, newList);
    };

    return (
        <ListView
            schema={schema as Schema}
            title={title || fieldSchema.label || 'Items'}
            items={list}
            onAdd={() => handleAddItem()}
            onEdit={(index) => handleEditItem(index)}
            onDelete={(index) => handleDeleteItem(index)}
            addButtonText="Add"
            pathPrefix={path}
            dense={dense}
            fieldSchema={fieldSchema}
        />
    );
};