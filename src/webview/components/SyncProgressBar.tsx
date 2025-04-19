import React from 'react';
import { Box, Typography } from '@mui/material';
import LinearProgress from '@mui/material/LinearProgress';
import { useLiPDStore } from '../store';

/**
 * Component that displays a progress bar when syncing to GraphDB
 */
const SyncProgressBar: React.FC = () => {
  const { isSyncing, syncProgress } = useLiPDStore(state => ({
    isSyncing: state.isSyncing,
    syncProgress: state.syncProgress || 0
  }));

  if (!isSyncing) {
    return null;
  }

  return (
    <Box 
      sx={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 9999,
        bgcolor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Syncing to GraphDB...
      </Typography>
      <LinearProgress 
        variant="determinate" 
        value={syncProgress} 
        sx={{ 
          width: '80%', 
          height: 10,
          borderRadius: 5,
          '& .MuiLinearProgress-bar': {
            backgroundColor: 'primary.main'
          }
        }} 
      />
      <Typography variant="caption" sx={{ mt: 1 }}>
        {syncProgress}% Complete
      </Typography>
    </Box>
  );
};

export default SyncProgressBar; 