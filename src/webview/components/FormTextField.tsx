import React, { useRef, useState, useEffect } from 'react';
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
    // Use local state for immediate UI rendering
    const [value, setValue] = useState(defaultValue?.toString() || '');
    // Track the last value we sent to parent to prevent duplicate updates
    const lastUpdateRef = useRef(defaultValue?.toString() || '');
    
    // Update local state when defaultValue prop changes (like during undo)
    useEffect(() => {
        setValue(defaultValue?.toString() || '');
        // Also update our tracking ref when props change
        lastUpdateRef.current = defaultValue?.toString() || '';
    }, [defaultValue]);
    
    const handleUpdate = (newValue: string) => {
        // Only notify parent if value has changed AND we haven't already sent this update
        if (newValue !== defaultValue?.toString() && newValue !== lastUpdateRef.current) {
            // Store the value we're about to send to prevent duplicates
            lastUpdateRef.current = newValue;
            onBlur(newValue);
        }
    };
    
    return (
        <FormControl variant={formVariant} sx={{ mt: 1,width: '100%' }}>
            <TextField
                key={key}
                inputRef={inputRef}
                label={label}
                value={value}
                variant={formVariant}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
                onBlur={() => {
                    if (inputRef.current) {
                        handleUpdate(inputRef.current.value);
                    }
                }}
                onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' && inputRef.current) {
                        handleUpdate(inputRef.current.value);
                        inputRef.current.blur();
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