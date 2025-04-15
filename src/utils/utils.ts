import { Schema } from "../webview/schemas";

import { SchemaField } from "../webview/schemas";

export const formVariant = "standard";

// Helper function to get a value from the dataset using a path
export  const getValueFromPath = (dataset: any, path: string): any => {
    if (!path) return dataset;
    
    const parts = path.split('.');
    parts.shift(); // Remove the first part, which is the dataset

    let current: any = dataset;
    
    for (const part of parts) {
        if (!current || current[part] === undefined) {
            return null;
        }
        current = current[part];
    }
    
    return current;
};


    // Helper function to create a default item based on schema
export const createDefaultItem = (objectSchema: Schema | undefined, fieldSchema: SchemaField | undefined): any => {
    // console.log("Creating default item for objectSchema:", objectSchema, "and fieldSchema:", fieldSchema);
    if (objectSchema) {
        // This is a Top level schema object
        const obj: any = new objectSchema.class();
        Object.entries(objectSchema.fields || {}).forEach(([key, propSchema]) => {
            obj[key] = createDefaultItem(propSchema.schema, propSchema);
        });
        return obj;
    }
    else if (fieldSchema) {
        // This is a SchemaField
        if (fieldSchema.type === 'object' && fieldSchema.schema) {
            const obj: any = new fieldSchema.schema.class();
            Object.entries(fieldSchema.schema.fields || {}).forEach(([key, propSchema]) => {
                obj[key] = createDefaultItem(propSchema.schema, propSchema);
            });
            return obj;
        }
        return getDefaultValueForType(fieldSchema);            
    }
    else {
        return {};
    }
};

// Helper function to get default value based on type
const getDefaultValueForType = (schema: SchemaField): any => {
    switch (schema.type) {
        case 'string':
            return '';
        case 'number':
            return 0;
        case 'boolean':
            return false;
        case 'array':
            return [];
        case 'object':
            return {};
        default:
            return null;
    }
};
