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