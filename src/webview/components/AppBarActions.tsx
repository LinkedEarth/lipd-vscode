import React from 'react';
import { Box, Button, IconButton } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import SaveIcon from '@mui/icons-material/Save';
import { useLiPDStore } from '../store';

const AppBarActions: React.FC = () => {
  const { saveDataset, saveDatasetAs, isSaving } = useLiPDStore(state => ({
    saveDataset: state.saveDataset,
    saveDatasetAs: state.saveDatasetAs,
    isSaving: state.isSaving
  }));

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Tooltip title="Save current file">
        <IconButton 
          onClick={saveDataset} 
          disabled={isSaving}
          size="small"
          aria-label="Save"
          sx={{ mr: 1 }}
        >
          <SaveIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Button
        variant="outlined"
        size="small"
        onClick={saveDatasetAs}
        disabled={isSaving}
      >
        Save As...
      </Button>
    </Box>
  );
};

export default AppBarActions; 