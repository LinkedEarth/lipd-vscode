import React from 'react';
import { Dataset } from 'lipdjs';
import { useLiPDStore } from '../store';
import TreeItem from './TreeItem';

interface PublicationsTreeProps {
    dataset: Dataset;
}

const PublicationsTree: React.FC<PublicationsTreeProps> = ({ dataset }) => {
    const { expandedNodes } = useLiPDStore(state => ({
        expandedNodes: state.expandedNodes
    }));

    return (
        <>
            <TreeItem
                node={dataset}
                label="Publications"
                nodeId="publications"
                hasChildren={false}
            />
            {expandedNodes.has('publications') && dataset.getPublications()?.map((publication, index) => {
                const pubNodeId = `publications.${index}`;
                return (
                    <TreeItem
                        key={pubNodeId}
                        node={publication}
                        label={publication.getTitle() || `Publication ${index + 1}`}
                        nodeId={pubNodeId}
                        hasChildren={false}
                        level={1}
                    />
                );
            })}
        </>
    );
};

export default PublicationsTree; 