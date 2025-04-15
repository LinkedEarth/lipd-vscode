import React from 'react';
import { Router } from '../router';
import { Box } from '@mui/material';


export const EditorPanel: React.FC = () => {
  return (
    <Box sx={{ px: 2, py: 1 }}>
      <Router />
    </Box>
  );
};