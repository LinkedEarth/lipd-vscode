import React from 'react';
import { Box } from '@mui/material';
import { Publication, Dataset } from 'lipdjs';
import { AppState } from '../types';
import AutoForm from './AutoForm';
import { useLiPDStore } from '../store';
import ListView from './ListView';

interface PublicationEditorProps {
    publication: Publication;
    index: number;
    updateDataset: AppState['updateDataset'];
}

const PublicationEditor: React.FC<PublicationEditorProps> = ({ publication, index, updateDataset }) => {
    return (
        <Box sx={{ p: 2 }}>
            <AutoForm
                object={publication}
                onUpdate={(path, value) => {
                    updateDataset(`publications.${index}.${path}`, value);
                }}
                pathPrefix={`publications.${index}`}
                columns={1}
            />
        </Box>
    );
};

interface PublicationListViewProps {
    dataset: Dataset;
    updateDataset: AppState['updateDataset'];
}

const PublicationListView: React.FC<PublicationListViewProps> = ({ dataset, updateDataset }) => {
    const setSelectedNode = useLiPDStore(state => state.setSelectedNode);

    const publications = dataset.getPublications() || [];

    const handleAdd = () => {
        const newPublication = new Publication();
        const updatedPublications = [...publications, newPublication];
        updateDataset('publications', updatedPublications);
        setSelectedNode(`publications.${publications.length}`);
    };

    const handleEdit = (index: number) => {
        setSelectedNode(`publications.${index}`);
    };

    const handleDelete = (index: number) => {
        const updatedPublications = [...publications];
        updatedPublications.splice(index, 1);
        updateDataset('publications', updatedPublications);
    };

    return (
        <Box sx={{ p: 2 }}>
            <ListView
                title="Publications"
                items={publications.map((item, index) => ({
                primary: item.getTitle() || `Publication ${index + 1}`,
                secondary: item.getAuthors()?.map(author => author.getName()).join(', ') || 'No authors'
            }))}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            addButtonText="Add Publication"
        />
        </Box>
    );
};

export { PublicationEditor, PublicationListView }; 