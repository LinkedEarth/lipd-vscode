import React, { useRef } from 'react';
import { 
    TextField, 
} from '@mui/material';

// TextField component with proper hook usage
export const FormTextField = React.memo(({ 
    label, 
    defaultValue, 
    type, 
    multiline, 
    rows, 
    onBlur 
}: { 
    label: string;
    defaultValue: string | number;
    type?: string;
    multiline?: boolean;
    rows?: number;
    onBlur: (value: string) => void;
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    
    return (
        <TextField
            inputRef={inputRef}
            label={label}
            defaultValue={defaultValue || ''}
            onBlur={() => {
                if (inputRef.current) {
                    const newValue = inputRef.current.value;
                    // Only update if the value changed
                    if (newValue !== defaultValue) {
                        onBlur(newValue);
                    }
                }
            }}
            onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' && inputRef.current) {
                    const newValue = inputRef.current.value;
                    if (newValue !== defaultValue) {
                        onBlur(newValue);
                        // Blur the field to prevent duplicate updates
                        inputRef.current.blur();
                    }
                }
            }}
            fullWidth
            size="small"
            margin="dense"
            type={type}
            multiline={multiline}
            rows={rows}
            sx={{ width: '100%' }}
        />
    );
});