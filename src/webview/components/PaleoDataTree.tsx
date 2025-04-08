import React from 'react';
import { Dataset } from 'lipdjs';
import { useLiPDStore } from '../store';
import TreeItem from './TreeItem';

interface PaleoDataTreeProps {
    dataset: Dataset;
}

const PaleoDataTree: React.FC<PaleoDataTreeProps> = ({ dataset }) => {
    const { expandedNodes } = useLiPDStore(state => ({
        expandedNodes: state.expandedNodes
    }));

    return (
        <>
            <TreeItem
                node={dataset}
                label="PaleoData"
                nodeId="paleoData"
                hasChildren={true}
            />
            {expandedNodes.has('paleoData') && dataset.getPaleoData()?.map((paleoData, paleoIndex) => {
                const paleoNodeId = `paleoData.${paleoIndex}`;
                const hasChildren = paleoData.getMeasurementTables() && paleoData.getMeasurementTables().length > 0;

                return (
                    <React.Fragment key={paleoNodeId}>
                        <TreeItem
                            node={paleoData}
                            label={paleoData.getName() || `PaleoData ${paleoIndex + 1}`}
                            nodeId={paleoNodeId}
                            hasChildren={hasChildren}
                            level={1}
                        />
                        {expandedNodes.has(paleoNodeId) && hasChildren && paleoData.getMeasurementTables()?.map((table, tableIndex) => {
                            const tableNodeId = `paleoData.${paleoIndex}.measurementTables.${tableIndex}`;
                            return (
                                <React.Fragment key={tableNodeId}>
                                    <TreeItem
                                        node={table}
                                        label={table.getFileName() || `Table ${tableIndex + 1}`}
                                        nodeId={tableNodeId}
                                        hasChildren={false}
                                        level={2}
                                    />
                                </React.Fragment>
                            );
                        })}
                    </React.Fragment>
                );
            })}
        </>
    );
};

export default PaleoDataTree; 