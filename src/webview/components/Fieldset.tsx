import React from "react";
import { Box } from "@mui/material";


export const Fieldset = ({ legend, children }: { legend: string; children: React.ReactNode }) => (
    <Box 
        component="fieldset" 
                    sx={{ 
                        m: 0,
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        width: '100%',
                        '& legend': {
                            px: 1,
                            color: 'text.secondary',
                            fontSize: '0.875rem',
                            fontWeight: 500
                        }
                    }}
    >
        <legend>{legend}</legend>
        {children}
    </Box>
);