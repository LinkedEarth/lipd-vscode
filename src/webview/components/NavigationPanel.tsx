import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { TreeView } from '@mui/x-tree-view/TreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { Dataset } from 'lipdjs';
import { useLiPDStore } from '../store';

const NavigationPanel: React.FC<{ dataset: Dataset | null }> = ({ dataset }) => {
    const { expandedNodes, setExpandedNodes, setSelectedNode } = useLiPDStore((state: any) => ({
        expandedNodes: state.expandedNodes,
        setExpandedNodes: state.setExpandedNodes,
        setSelectedNode: state.setSelectedNode
    }));
    
    if (!dataset) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!(dataset instanceof Dataset)) {
        dataset = Dataset.fromDictionary(dataset);
    }

    const handleNodeToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
        setExpandedNodes(new Set(nodeIds));
    };

    const handleNodeSelect = (event: React.SyntheticEvent<Element, Event>, itemId: string | null) => {
        // console.log('TreeView selected:', itemId);
        setSelectedNode(itemId || '');
    };

    const renderPaleoDataTree = () => {
        return (
            <TreeItem itemId="dataset.paleoData" label="PaleoData">
                {dataset.getPaleoData()?.map((paleoData, paleoIndex) => {
                    const paleoNodeId = `dataset.paleoData.${paleoIndex}`;
                    return (
                        <TreeItem key={paleoNodeId} itemId={paleoNodeId} label={paleoData.getName() || `PaleoData ${paleoIndex + 1}`}>
                            {paleoData.getMeasurementTables()?.map((table, tableIndex) => {
                                const tableNodeId = `dataset.paleoData.${paleoIndex}.measurementTables.${tableIndex}`;
                                return (
                                    <TreeItem 
                                        key={tableNodeId} 
                                        itemId={tableNodeId} 
                                        label={table.getFileName() || `Table ${tableIndex + 1}`}
                                    />
                                );
                            })}
                        </TreeItem>
                    );
                })}
            </TreeItem>
        );
    };

    const renderChronDataTree = () => {
        return (
            <TreeItem itemId="dataset.chronData" label="ChronData">
                {dataset.getChronData()?.map((chronData, chronIndex) => {
                    const chronNodeId = `dataset.chronData.${chronIndex}`;
                    return (
                        <TreeItem key={chronNodeId} itemId={chronNodeId} label={`ChronData ${chronIndex + 1}`}>
                            {chronData.getMeasurementTables()?.map((table, tableIndex) => {
                                const tableNodeId = `dataset.chronData.${chronIndex}.measurementTables.${tableIndex}`;
                                return (
                                    <TreeItem 
                                        key={tableNodeId} 
                                        itemId={tableNodeId} 
                                        label={table.getFileName() || `Table ${tableIndex + 1}`}
                                    />
                                );
                            })}
                        </TreeItem>
                    );
                })}
            </TreeItem>
        );
    };

    const renderPublicationsTree = () => {
        return (
            <TreeItem itemId="dataset.publications" label="Publications">
                {dataset.getPublications()?.map((publication, index) => {
                    const pubNodeId = `dataset.publications.${index}`;
                    return (
                        <TreeItem 
                            key={pubNodeId} 
                            itemId={pubNodeId} 
                            label={publication.getTitle() || `Publication ${index + 1}`}
                        />
                    );
                })}
            </TreeItem>
        );
    };

    return (
        <Box sx={{ p: 2 }}>
            <TreeView
                aria-label="dataset navigation"
                expandedItems={Array.from(expandedNodes)}
                onExpandedItemsChange={handleNodeToggle}
                onSelectedItemsChange={handleNodeSelect}
                sx={{ height: '100%', flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
            >
                <TreeItem itemId="dataset" label="Dataset">
                    {renderPaleoDataTree()}
                    {renderChronDataTree()}
                    {renderPublicationsTree()}
                    <TreeItem
                        itemId="dataset.changeLogs"
                        label="ChangeLogs"
                    />
                </TreeItem>
            </TreeView>
        </Box>
    );
};

export default NavigationPanel; 