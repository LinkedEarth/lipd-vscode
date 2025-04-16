import React from 'react';
import { Box, Button, IconButton, Divider } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import { useLiPDStore } from '../store';

const AppBarActions: React.FC = () => {
  const { saveDataset, saveDatasetAs, undo, redo, isSaving, canUndo, canRedo } = useLiPDStore(state => ({
    saveDataset: state.saveDataset,
    saveDatasetAs: state.saveDatasetAs,
    undo: state.undo,
    redo: state.redo,
    isSaving: state.isSaving,
    canUndo: state.canUndo,
    canRedo: state.canRedo
  }));

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {/* Edit actions */}
      <Box sx={{ display: 'flex', mr: 2 }}>
        <Tooltip title="Undo (VS Code Cmd+Z / Ctrl+Z)">
          <span>
            <IconButton 
              onClick={undo} 
              disabled={!canUndo || isSaving}
              size="small"
              aria-label="Undo"
              sx={{ mr: 0.5 }}
            >
              <UndoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        
        <Tooltip title="Redo (VS Code Cmd+Shift+Z / Ctrl+Y)">
          <span>
            <IconButton 
              onClick={redo} 
              disabled={!canRedo || isSaving}
              size="small"
              aria-label="Redo"
            >
              <RedoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      
      {/* Save actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
        <Tooltip title="Save (VS Code Cmd+S / Ctrl+S)">
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
    </Box>
  );
};

export default AppBarActions; 