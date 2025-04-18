import React, { useState } from 'react';
import { Box, List, ListItem, ListItemText, Divider, IconButton, Typography, Button, TextField } from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import CheckIcon from '@mui/icons-material/Check';
import { useLiPDStore } from '../store';
import { Schema, SchemaField } from '../schemas';
import { Fieldset } from './Fieldset';
import { formVariant } from '../../utils/utils';

interface ListViewProps {
    title: string;
    items: Array<any>;
    schema: Schema;
    onAdd: () => void;
    onEdit: (index: number) => void;
    onDelete: (index: number) => void;
    addButtonText: string;
    pathPrefix?: string;
    dense?: boolean;
    useFieldset?: boolean;
    fieldSchema?: SchemaField;
}

const ListView: React.FC<ListViewProps> = ({ 
    title, 
    items, 
    schema,
    onAdd, 
    onEdit, 
    onDelete, 
    addButtonText,
    pathPrefix,
    dense = true,
    useFieldset = true,
    fieldSchema = {} as SchemaField
}) => {
    const setSelectedNode = useLiPDStore((state: any) => state.setSelectedNode);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [addingNew, setAddingNew] = useState<boolean>(false);
    const [newItemValue, setNewItemValue] = useState<string>('');

    // Determine if this is a list of simple values
    const isSimpleList = !schema; // There is no schema associated with simple objects

    const handleEdit = (index: number) => {
        if (typeof items[index] !== 'object') {
            setEditIndex(index);
            setEditValue(String(items[index]));
        } else if (pathPrefix) {
            setSelectedNode(`${pathPrefix}.${index}`);
            // onEdit(index);
        } else {
            // onEdit(index);
        }
    };

    const handleSave = (index: number) => {
        // Create a new array to avoid mutating the original
        const updatedItems = [...items];
        // Update the value at the specified index
        updatedItems[index] = editValue;
        
        // For simple values, update directly without triggering navigation
        if (typeof items[index] !== 'object' && pathPrefix) {
            // If we have a path prefix, we can update the parent directly
            const path = `${pathPrefix}.${index}`;
            const updateDataset = useLiPDStore.getState().updateDataset;
            updateDataset(path, editValue);
        } else {
            // Only call onEdit for complex objects
            onEdit(index);
        }
        
        // Reset edit state
        setEditIndex(null);
    };

    const handleAddNew = () => {
        if (isSimpleList) {
            // For simple lists, show the add form instead of navigating
            setAddingNew(true);
            setNewItemValue('');
        } else {
            // For complex objects, use the default add behavior
            onAdd();
        }
    };

    const handleSaveNewItem = () => {
        if (pathPrefix && newItemValue.trim() !== '') {
            // Get current items
            const updatedItems = [...items, newItemValue];
            
            // Update the dataset with the new array
            const updateDataset = useLiPDStore.getState().updateDataset;
            updateDataset(pathPrefix, updatedItems);
            
            // Reset add state
            setAddingNew(false);
            setNewItemValue('');
        }
    };

    const handleDelete = (index: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent the ListItem click
        onDelete(index);
    };

    const content = (
        <>
            <List dense={dense} sx={{ width: '100%', p: 0 }}>
                {(items || []).map((item, index) => {
                    // console.log(item);
                    // console.log(schema);
                    let primary = schema?.label?.primary ? schema.label.primary(item) : "Item " + (index + 1);
                    let secondary = schema?.label?.secondary ? schema.label.secondary(item) : ""

                    if (!primary) {
                        primary = "Unnamed"
                    }
                    const isSimpleValue = typeof item !== 'object';
                    if (isSimpleValue) {
                        primary = String(item);
                    }                    
                    
                    return (
                    <React.Fragment key={index}>
                        {index > 0 && <Divider />}
                        <ListItem
                            button={isSimpleValue ? false : true}
                            onClick={() => isSimpleValue ? null : handleEdit(index)}
                            sx={{
                                cursor: isSimpleValue ? 'default' : 'pointer',
                                '&:hover': {
                                    backgroundColor: 'action.hover',
                                }
                            }}
                            secondaryAction={
                                <Box sx={{ display: 'flex' }}>
                                    {editIndex === index ? (
                                        <IconButton
                                            edge="end"
                                            aria-label="save"
                                            onClick={() => handleSave(index)}
                                            size={dense ? "small" : "medium"}
                                        >
                                            <CheckIcon sx={{ fontSize: dense ? 16 : 24 }} />
                                        </IconButton>
                                    ) : isSimpleValue ? (
                                        <IconButton
                                            edge="end"
                                            aria-label="edit"
                                            onClick={() => handleEdit(index)}
                                            size={dense ? "small" : "medium"}
                                        >
                                            <Edit sx={{ fontSize: dense ? 16 : 24 }} />
                                        </IconButton>
                                    ) : null}
                                    <IconButton
                                        edge="end"
                                        aria-label="delete"
                                        onClick={(e: React.MouseEvent) => handleDelete(index, e)}
                                        size={dense ? "small" : "medium"}
                                    >
                                        <Delete sx={{ fontSize: dense ? 16 : 24 }} />
                                    </IconButton>
                                </Box>
                            }
                        >
                            {editIndex === index ? (
                                <TextField
                                    value={editValue}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
                                    variant={formVariant}
                                    size="small"
                                    fullWidth
                                    autoFocus
                                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                        if (e.key === 'Enter') {
                                            handleSave(index);
                                        } else if (e.key === 'Escape') {
                                            setEditIndex(null);
                                        }
                                    }}
                                />
                            ) : (
                                <ListItemText
                                    primaryTypographyProps={{
                                        fontSize: dense ? '0.9rem' : '1.2rem'
                                    }}
                                    secondaryTypographyProps={{
                                        fontSize: dense ? '0.8rem' : '0.9rem'
                                    }}
                                    primary={primary}
                                    secondary={secondary}
                                />
                            )}
                        </ListItem>
                    </React.Fragment>
                    );
                })}
                
                {/* Add new item input field */}
                {addingNew && (
                    <ListItem>
                        <TextField
                            value={newItemValue}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItemValue(e.target.value)}
                            variant={formVariant}
                            size="small"
                            fullWidth
                            autoFocus
                            placeholder="Enter new item"
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                if (e.key === 'Enter') {
                                    handleSaveNewItem();
                                } else if (e.key === 'Escape') {
                                    setAddingNew(false);
                                }
                            }}
                            InputProps={{
                                endAdornment: (
                                    <IconButton
                                        size="small"
                                        onClick={handleSaveNewItem}
                                    >
                                        <CheckIcon fontSize="small" />
                                    </IconButton>
                                )
                            }}
                        />
                    </ListItem>
                )}
            </List>
        </>
    );

    if (useFieldset) {
        return (
            <Fieldset dense={dense}>
                <legend>
                    {title}
                    <Button
                        onClick={handleAddNew}
                        startIcon={<Add />}
                    >
                        {addButtonText}
                    </Button>
                </legend>
                {content}
            </Fieldset>
        );
    }

    return content;
};

export default ListView; 