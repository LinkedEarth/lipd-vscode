import React, { useRef } from 'react';
import { 
    TextField, 
} from '@mui/material';
import FormControl from '@mui/material/FormControl';
import { formVariant } from '../../utils/utils';

// TextField component with proper hook usage
export const FormTextField = React.memo(({ 
    label, 
    key,
    defaultValue, 
    type, 
    multiline, 
    rows, 
    onBlur 
}: { 
    label: string;
    key: string;
    defaultValue: string | number;
    type?: string;
    multiline?: boolean;
    rows?: number;
    onBlur: (value: string) => void;
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    
    return (
        <FormControl variant={formVariant} sx={{ mt: 1,width: '100%' }}>
            <TextField
                key={key}
                inputRef={inputRef}
                label={label}
                defaultValue={defaultValue || ''}
                variant={formVariant}
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
        </FormControl>
    );
});