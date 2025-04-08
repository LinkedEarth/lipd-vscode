import React from 'react';
import { Dataset } from 'lipdjs';
import { useLiPDStore } from '../store';
import TreeItem from './TreeItem';

interface ChronDataTreeProps {
    dataset: Dataset;
}

const ChronDataTree: React.FC<ChronDataTreeProps> = ({ dataset }) => {
    const { expandedNodes } = useLiPDStore(state => ({
        expandedNodes: state.expandedNodes
    }));

    return (
        <>
            <TreeItem
                node={dataset}
                label="ChronData"
                nodeId="chronData"
                hasChildren={true}
            />
            {expandedNodes.has('chronData') && dataset.getChronData()?.map((chronData, chronIndex) => {
                const chronNodeId = `chronData.${chronIndex}`;
                const hasChildren = chronData.getMeasurementTables() && chronData.getMeasurementTables().length > 0;

                return (
                    <React.Fragment key={chronNodeId}>
                        <TreeItem
                            node={chronData}
                            label={`ChronData ${chronIndex + 1}`}
                            nodeId={chronNodeId}
                            hasChildren={hasChildren}
                            level={1}
                        />
                        {expandedNodes.has(chronNodeId) && hasChildren && chronData.getMeasurementTables()?.map((table, tableIndex) => {
                            const tableNodeId = `chronData.${chronIndex}.measurementTables.${tableIndex}`;
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

export default ChronDataTree; 