import React from "react";
import { Box } from "@mui/material";


export const Fieldset = ({ children, dense = false }: { children: React.ReactNode, dense?: boolean }) => (
    <Box 
        component="fieldset" 
        sx={{ 
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            px: dense ? 0 : 1,
            mt: 1,
            '& legend': {
                color: 'text.secondary',
                fontSize: '0.75rem',
                fontWeight: 400,
                ml:1,
                '& .MuiButton-root': {
                    fontSize: '0.75rem',
                    borderRadius: 1,
                    color: 'inherit',
                    '&:hover': {
                        bgcolor: 'action.hover'
                    }
                },
                '& .MuiSvgIcon-root': {
                    fontSize: '0.75rem'
                }
            }
        }}
    >
        {children}
    </Box>
);