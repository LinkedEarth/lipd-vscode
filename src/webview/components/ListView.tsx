import React from 'react';
import { Box, List, ListItem, ListItemText, Divider, IconButton, Typography, Button } from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { useLiPDStore } from '../store';
import { Schema } from '../schemas';

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
    useFieldset = true
}) => {
    const setSelectedNode = useLiPDStore((state: any) => state.setSelectedNode);

    const handleEdit = (index: number) => {
        if (pathPrefix) {
            setSelectedNode(`${pathPrefix}.${index}`);
        }
        onEdit(index);
    };

    const content = (
        <>
            {!useFieldset && (
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: dense ? 0 : 2 
                }}>
                    <Typography variant={dense ? "subtitle1" : "h6"}>{title}</Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add sx={{ fontSize: dense ? 16 : 24 }} />}
                        onClick={onAdd}
                        size={dense ? "small" : "medium"}
                    >
                        {addButtonText}
                    </Button>
                </Box>
            )}
            <List dense={dense} sx={{ width: '100%', p: 0 }}>
                {(items || []).map((item, index) => {
                    const primary = schema?.label?.primary ? schema.label.primary(item) : "Item " + (index + 1);
                    const secondary = schema?.label?.secondary ? schema.label.secondary(item) : ""
                    
                    return (
                    <React.Fragment key={index}>
                        {index > 0 && <Divider />}
                        <ListItem
                            button
                            onClick={() => handleEdit(index)}
                            sx={{
                                cursor: 'pointer',
                                '&:hover': {
                                    backgroundColor: 'action.hover',
                                }
                            }}
                            secondaryAction={
                                <Box sx={{ display: 'flex' }}>
                                    <IconButton
                                        edge="end"
                                        aria-label="delete"
                                        onClick={(e: React.MouseEvent) => {
                                            e.stopPropagation(); // Prevent the ListItem click
                                            onDelete(index);
                                        }}
                                        size={dense ? "small" : "medium"}
                                    >
                                        <Delete sx={{ fontSize: dense ? 16 : 24 }} />
                                    </IconButton>
                                </Box>
                            }
                        >
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
                        </ListItem>
                    </React.Fragment>
                    );
                })}
            </List>
        </>
    );

    if (useFieldset) {
        return (
            <Box 
                component="fieldset" 
                sx={{ 
                    m: 0,
                    mb: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    '& legend': {
                        m: 0,
                        px: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: 'text.secondary',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        '& .MuiButton-root': {
                            minWidth: 0,
                            p: 0.5,
                            borderRadius: 1,
                            color: 'inherit',
                            '&:hover': {
                                bgcolor: 'action.hover'
                            }
                        },
                        '& .MuiSvgIcon-root': {
                            fontSize: '1rem'
                        }
                    }
                }}
            >
                <legend>
                    {title}
                    <Button
                        onClick={onAdd}
                        startIcon={<Add />}
                        sx={{ ml: 1 }}
                    >
                        {addButtonText}
                    </Button>
                </legend>
                {content}
            </Box>
        );
    }

    return content;
};

export default ListView; 