import React, { useState } from 'react';
import { 
    TextField, 
    Grid, 
    Box, 
    Typography, 
    Chip,
    Button,
    IconButton,
    List,
    ListItem,
    ListItemText,
    AppBar,
    Toolbar,
    Breadcrumbs,
    Paper
} from '@mui/material';
import Link from '@mui/material/Link';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { getSchemaForClass, SchemaField } from '../schemas';
import ListView from './ListView';
import { useLiPDStore } from '../store';
import DataTableEditor from './DataTableEditor';
import VariableEditor from './VariableEditor';
import ModelEditor from './ModelEditor';
import { DataTable, Variable, Model } from 'lipdjs';
import LocationEditor from './LocationEditor';

interface AutoFormProps {
    object: any;
    onUpdate: (path: string, value: any) => void;
    onSave?: () => void;
    className?: string;
    pathPrefix?: string;
    breadcrumbs?: Array<{
        label: string;
        onClick?: () => void;
    }>;
    columns?: number;
}

interface EditDialogProps {
    open: boolean;
    onClose: () => void;
    item: any;
    schema: SchemaField;
    onSave: (updatedItem: any) => void;
    isNew?: boolean;
}

interface CurrentEditItem {
    item: any;
    index: number | null;
    schema?: SchemaField;
    fieldName?: string;
}

const EditDialog: React.FC<EditDialogProps> = ({ open, onClose, item, schema, onSave, isNew = false }) => {
    const [editedItem, setEditedItem] = useState(item);

    const handleUpdate = (path: string, value: any) => {
        setEditedItem((prev: any) => {
            const newItem = { ...prev };
            const pathParts = path.split('.');
            let current = newItem;
            for (let i = 0; i < pathParts.length - 1; i++) {
                if (!current[pathParts[i]]) {
                    current[pathParts[i]] = {};
                }
                current = current[pathParts[i]];
            }
            current[pathParts[pathParts.length - 1]] = value;
            return newItem;
        });
    };

    // Check if we should use a specialized editor
    const getSpecializedEditor = () => {
        if (item instanceof DataTable) {
            return (
                <DataTableEditor
                    table={item}
                    onUpdate={(updatedTable) => {
                        setEditedItem(updatedTable);
                    }}
                />
            );
        }
        if (item instanceof Variable) {
            return (
                <VariableEditor
                    variable={item}
                    onUpdate={(updatedVariable) => {
                        setEditedItem(updatedVariable);
                    }}
                />
            );
        }
        if (item instanceof Model) {
            return (
                <ModelEditor
                    model={item}
                    onUpdate={(updatedModel) => {
                        setEditedItem(updatedModel);
                    }}
                />
            );
        }
        return null;
    };

    const specializedEditor = getSpecializedEditor();

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth={specializedEditor ? "lg" : "sm"} 
            fullWidth
            PaperProps={{
                sx: { borderRadius: 1 }
            }}
        >
            <DialogTitle sx={{ 
                py: 1.5,
                px: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                typography: 'subtitle1'
            }}>
                {isNew ? 'Add New Item' : 'Edit Item'}
            </DialogTitle>
            <DialogContent sx={{ p: 2 }}>
                {specializedEditor ? (
                    specializedEditor
                ) : (
                    <Grid container spacing={1}>
                        {Object.entries(schema.properties || {}).map(([fieldName, fieldSchema]) => {
                            const value = editedItem[fieldName] ?? '';
                            
                            if (fieldSchema.enum) {
                                return (
                                    <Grid item xs={12} key={fieldName}>
                                        <FormControl fullWidth size="small" margin="dense">
                                            <InputLabel>{fieldSchema.label || fieldName}</InputLabel>
                                            <Select
                                                value={value?.label || ''}
                                                label={fieldSchema.label || fieldName}
                                                onChange={(event: SelectChangeEvent<string>) => {
                                                    handleUpdate(fieldName, event.target.value);
                                                }}
                                            >
                                                <MenuItem value="">
                                                    <em>None</em>
                                                </MenuItem>
                                                {fieldSchema.enum.map((option) => (
                                                    <MenuItem key={option} value={option}>
                                                        {option}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                );
                            }

                            if (fieldSchema.type === 'string' || fieldSchema.type === 'number') {
                                return (
                                    <Grid item xs={12} key={fieldName}>
                                        <TextField
                                            label={fieldSchema.label || fieldName}
                                            value={value}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                                handleUpdate(fieldName, e.target.value)
                                            }
                                            fullWidth
                                            size="small"
                                            margin="dense"
                                            type={fieldSchema.type}
                                            multiline={fieldSchema.multiline}
                                            rows={fieldSchema.rows}
                                        />
                                    </Grid>
                                );
                            }

                            if (fieldSchema.type === 'object' && fieldSchema.properties) {
                                return (
                                    <Grid item xs={12} key={fieldName}>
                                        <Box sx={{ mt: 2, mb: 2 }}>
                                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                                {fieldSchema.label || fieldName}
                                            </Typography>
                                            <Box sx={{ pl: 2 }}>
                                                {Object.entries(fieldSchema.properties).map(([propName, propSchema]) => {
                                                    const propValue = editedItem[fieldName]?.[propName] ?? '';
                                                    
                                                    if (propSchema.enum) {
                                                        return (
                                                            <FormControl fullWidth margin="normal" key={propName}>
                                                                {/* <InputLabel>{propSchema.label || propName}</InputLabel> */}
                                                                <Select
                                                                    value={propValue || ''}
                                                                    label={propSchema.label || propName}
                                                                    onChange={(event: SelectChangeEvent<string>) => {
                                                                        handleUpdate(`${fieldName}.${propName}`, event.target.value);
                                                                    }}
                                                                >
                                                                    <MenuItem value="">
                                                                        <em>None</em>
                                                                    </MenuItem>
                                                                    {propSchema.enum.map((option) => (
                                                                        <MenuItem key={option} value={option}>
                                                                            {option}
                                                                        </MenuItem>
                                                                    ))}
                                                                </Select>
                                                            </FormControl>
                                                        );
                                                    }

                                                    return (
                                                        <TextField
                                                            key={propName}
                                                            label={propSchema.label || propName}
                                                            value={propValue}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                                                handleUpdate(`${fieldName}.${propName}`, e.target.value)
                                                            }
                                                            fullWidth
                                                            margin="normal"
                                                            type={propSchema.type}
                                                            multiline={propSchema.multiline}
                                                            rows={propSchema.rows}
                                                        />
                                                    );
                                                })}
                                            </Box>
                                        </Box>
                                    </Grid>
                                );
                            }

                            return null;
                        })}
                    </Grid>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button 
                    onClick={() => onSave(editedItem)} 
                    variant="contained" 
                    startIcon={<SaveIcon />}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const AutoForm: React.FC<AutoFormProps> = ({
    object,
    onUpdate,
    onSave,
    className,
    pathPrefix = '',
    breadcrumbs = [],
    columns = 1
}) => {
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [currentEditItem, setCurrentEditItem] = useState<CurrentEditItem>({ 
        item: null, 
        index: null 
    });
    const setSelectedNode = useLiPDStore(state => state.setSelectedNode);

    if (!object) return null;

    // Use reflection to determine the object's class name
    const getObjectClassName = (obj: any): string => {
        if (!obj) return 'Unknown';
        
        // If constructor name isn't available or is generic, use feature detection
        if (obj.getTitle) {
            return 'Publication';
        } else if (obj.getMeasurementTables) {
            if (obj.getName) {
                return 'PaleoData';
            } else {
                return 'ChronData';
            }
        } else if (obj.getProxy) {
            return 'Variable';
        } else if (obj.getVariables) {
            return 'DataTable';
        } else if (obj.getCode) {
            return 'Model';
        } else if (obj.getFundings) {
            return 'Dataset';
        }

        // Try to get the constructor name
        const constructorName = (obj.constructor?.name || '').replace(/\d+$/, '');
        if (constructorName && constructorName !== 'Object') {
            return constructorName;
        }        
        
        return 'Unknown';
    };
    
    // Get the object's class name using reflection
    const objectClassName = getObjectClassName(object);
    console.log('Detected class name:', objectClassName);

    
    const schema = getSchemaForClass(objectClassName);
    console.log('schema for class:', objectClassName, schema);
    if (!schema) return null;

    const handleEditItem = (item: any, index: number, schema: SchemaField, fieldName: string) => {
        // Set the selected node to the path of the item being edited
        console.log('handleEditItem:', {
            pathPrefix,
            fieldName,
            index,
            fullPath: pathPrefix ? `${pathPrefix}.${fieldName}.${index}` : `${fieldName}.${index}`
        });
        const path = pathPrefix ? `${pathPrefix}.${fieldName}.${index}` : `${fieldName}.${index}`;
        setSelectedNode(path);
    };

    const handleAddItem = (fieldName: string, itemSchema: SchemaField) => {
        // Create a new item with default values based on the schema
        const newItem = createDefaultItem(itemSchema);
        setCurrentEditItem({ 
            item: newItem, 
            index: null,
            schema: itemSchema,
            fieldName
        });
        setEditDialogOpen(true);
    };

    // Helper function to create a default item based on schema
    const createDefaultItem = (schema: SchemaField): any => {
        if (schema.type === 'object' && schema.properties) {
            const obj: Record<string, any> = {};
            Object.entries(schema.properties).forEach(([key, propSchema]) => {
                obj[key] = getDefaultValueForType(propSchema);
            });
            return obj;
        }
        return getDefaultValueForType(schema);
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
                if (schema.properties) {
                    const obj: Record<string, any> = {};
                    Object.entries(schema.properties).forEach(([key, propSchema]) => {
                        obj[key] = getDefaultValueForType(propSchema);
                    });
                    return obj;
                }
                return {};
            default:
                return null;
        }
    };

    const handleSaveItem = (fieldName: string, updatedItem: any) => {
        const arrayValue = object[`get${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}`]?.() || [];
        const newArray = [...arrayValue];
        
        if (currentEditItem.index !== null) {
            // Update existing item
            newArray[currentEditItem.index] = updatedItem;
        } else {
            // Add new item
            newArray.push(updatedItem);
        }
        
        const path = pathPrefix ? `${pathPrefix}.${fieldName}` : fieldName;
        onUpdate(path, newArray);
        setEditDialogOpen(false);
    };

    const handleDeleteItem = (fieldName: string, index: number) => {
        const arrayValue = object[`get${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}`]?.() || [];
        const newArray = arrayValue.filter((_: any, i: number) => i !== index);
        const path = pathPrefix ? `${pathPrefix}.${fieldName}` : fieldName;
        onUpdate(path, newArray);
    };

    const renderField = (fieldName: string, fieldSchema: SchemaField, path: string = fieldName) => {
        if (fieldName.startsWith('_')) return null;

        const value = object[`get${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}`]?.() ?? '';

        // Special handling for location fields
        if (fieldName === 'location') {
            const location = value || {};
            return (
                <Box 
                    component="fieldset" 
                    sx={{ 
                        m: 0,
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        '& legend': {
                            px: 1,
                            color: 'text.secondary',
                            fontSize: '0.875rem',
                            fontWeight: 500
                        }
                    }}
                >
                    <legend>Location</legend>
                    <LocationEditor
                        latitude={location.latitude}
                        longitude={location.longitude}
                        onUpdate={(field, newValue) => {
                            const updatedLocation = { ...location };
                            updatedLocation[field] = newValue;
                            onUpdate(path, updatedLocation);
                        }}
                    />
                </Box>
            );
        }

        if (fieldSchema.enum) {
            return (
                <FormControl fullWidth size="small" margin="dense">
                    <InputLabel>{fieldSchema.label || fieldName}</InputLabel>
                    <Select
                        value={value?.label || ''}
                        label={fieldSchema.label || fieldName}
                        onChange={(event: SelectChangeEvent<string>) => {
                            onUpdate(path, { name: event.target.value });
                        }}
                    >
                        <MenuItem value="">
                            <em>None</em>
                        </MenuItem>
                        {fieldSchema.enum.map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            );
        }

        if (fieldSchema.type === 'string' || fieldSchema.type === 'number') {
            return (
                <TextField
                    key={path}
                    label={fieldSchema.label || fieldName}
                    value={value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate(path, e.target.value)}
                    fullWidth
                    size="small"
                    margin="dense"
                    type={fieldSchema.type}
                    multiline={fieldSchema.multiline}
                    rows={fieldSchema.rows}
                />
            );
        }

        if (fieldSchema.type === 'object' && fieldSchema.properties) {
            const nestedObject = object[`get${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}`]?.();
            if (!nestedObject) return null;

            return (
                <Box 
                    key={path} 
                    component="fieldset" 
                    sx={{ 
                        mt: 2, 
                        mb: 2,
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        '& legend': {
                            px: 1,
                            color: 'text.secondary',
                            fontSize: '0.875rem',
                            fontWeight: 500
                        }
                    }}
                >
                    <legend>{fieldSchema.label || fieldName}</legend>
                    <Box sx={{ display: 'grid', gap: 1 }}>
                        {Object.entries(fieldSchema.properties).map(([propName, propSchema]) =>
                            renderField(propName, propSchema as SchemaField, `${path}.${propName}`)
                        )}
                    </Box>
                </Box>
            );
        }

        if (fieldSchema.type === 'array' && fieldSchema.items) {
            const arrayValue = value || [];
            
            return (
                <ListView
                    title={fieldSchema.label || fieldName}
                    items={arrayValue.map((item: any, index: number) => ({
                        primary: item.name || `Item ${index + 1}`,
                        secondary: item.description || ''
                    }))}
                    onAdd={() => handleAddItem(fieldName, fieldSchema.items as SchemaField)}
                    onEdit={(index) => handleEditItem(arrayValue[index], index, fieldSchema.items as SchemaField, fieldName)}
                    onDelete={(index) => handleDeleteItem(fieldName, index)}
                    addButtonText="Add"
                />
            );
        }

        return null;
    };

    return (
        <Box>
            <Grid container alignItems="flex-start" spacing={2}>
                {Object.entries(schema).map(([fieldName, fieldSchema]) => (
                    <Grid item xs={10} md={10/columns} key={fieldName}>
                        {renderField(fieldName, fieldSchema, pathPrefix ? `${pathPrefix}.${fieldName}` : fieldName)}
                    </Grid>
                ))}
            </Grid>
            {editDialogOpen && currentEditItem.item !== null && currentEditItem.schema && currentEditItem.fieldName && (
                <EditDialog
                    open={editDialogOpen}
                    onClose={() => setEditDialogOpen(false)}
                    item={currentEditItem.item}
                    schema={currentEditItem.schema as SchemaField}
                    onSave={(updatedItem) => handleSaveItem(currentEditItem.fieldName!, updatedItem)}
                    isNew={currentEditItem.index === null}
                />
            )}
        </Box>
    );
};

export default AutoForm; 