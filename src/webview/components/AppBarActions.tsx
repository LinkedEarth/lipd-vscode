import React from 'react';
import { Box, Button, IconButton, Divider } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import SaveIcon from '@mui/icons-material/Save';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import SyncIcon from '@mui/icons-material/Sync';
import { useLiPDStore } from '../store';

const AppBarActions: React.FC = () => {
  const { saveDataset, saveDatasetAs, syncDataset, undo, redo, isSaving, isSyncing, canUndo, canRedo, isRemote } = useLiPDStore(state => ({
    saveDataset: state.saveDataset,
    saveDatasetAs: state.saveDatasetAs,
    syncDataset: state.syncDataset,
    undo: state.undo,
    redo: state.redo,
    isSaving: state.isSaving,
    isSyncing: state.isSyncing,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    isRemote: state.isRemote
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
        
        <Tooltip title="Save As (VS Code Cmd+Shift+S / Ctrl+Shift+S)">
          <IconButton 
            onClick={saveDatasetAs} 
            disabled={isSaving}
            size="small"
            aria-label="Save"
            sx={{ mr: 1 }}
          >
            <SaveAsIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Sync to GraphDB">
          <IconButton 
            onClick={syncDataset} 
            disabled={isSyncing}
            size="small"
            aria-label="Sync to GraphDB"
            sx={{ mr: 1 }}
          >
            <SyncIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default AppBarActions; 