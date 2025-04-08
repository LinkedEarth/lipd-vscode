import React from 'react';
import { Box, Button } from '@mui/material';

const NavigationActions: React.FC = () => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-around',
                p: 1,
                borderTop: '1px solid',
                borderColor: 'divider',
                mt: 'auto'
            }}
        >
        </Box>
    );
};

export default NavigationActions; 