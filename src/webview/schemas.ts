import { SYNONYMS } from "lipdjs";

export interface SchemaField {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    label?: string;
    multiline?: boolean;
    rows?: number;
    items?: SchemaField;
    properties?: Record<string, SchemaField>;
    enum?: string[];
}

// Helper function to get unique labels from SYNONYMS
const getUniqueLabels = (category: string, className: string) => {
    const categoryObj = SYNONYMS[category as keyof typeof SYNONYMS];
    if (!categoryObj) return [];
    
    const synonyms = categoryObj[className as keyof typeof categoryObj];
    if (!synonyms) return [];
    
    const uniqueLabels = new Set<string>();
    Object.values(synonyms).forEach((entry: any) => {
        if (entry?.label) {
            uniqueLabels.add(entry.label);
        }
    });
    return Array.from(uniqueLabels);
};

export const archiveTypeSchema: Record<string, SchemaField> = {
    archiveType: {
        type: 'string',
        label: 'Archive Type',
        enum: getUniqueLabels('ARCHIVES', 'ArchiveType')
    }
};

export const proxySchema: Record<string, SchemaField> = {
    proxy: {
        type: 'string',
        label: 'Proxy',
        enum: getUniqueLabels('PROXIES', 'PaleoProxy')
    }
};

export const proxyGeneralSchema: Record<string, SchemaField> = {
    proxyGeneral: {
        type: 'string',
        label: 'Proxy General',
        enum: getUniqueLabels('PROXIES', 'PaleoProxyGeneral')
    }
};

export const interpretationVariableSchema: Record<string, SchemaField> = {
    variable: {
        type: 'string',
        label: 'Interpretation Variable',
        enum: getUniqueLabels('INTERPRETATION', 'InterpretationVariable')
    }
};

export const seasonalitySchema: Record<string, SchemaField> = {
    seasonality: {
        type: 'string',
        label: 'Seasonality',
        enum: getUniqueLabels('INTERPRETATION', 'InterpretationSeasonality')
    }
};

export const seasonalityGeneralSchema: Record<string, SchemaField> = {
  seasonalityGeneral: {
      type: 'string',
      label: 'Seasonality',
      enum: getUniqueLabels('INTERPRETATION', 'InterpretationSeasonality')
  }
};

export const seasonalityOriginalSchema: Record<string, SchemaField> = {
  seasonalityOriginal: {
      type: 'string',
      label: 'Seasonality',
      enum: getUniqueLabels('INTERPRETATION', 'InterpretationSeasonality')
  }
};

export const paleoUnitSchema: Record<string, SchemaField> = {
    units: {
        type: 'string',
        label: 'Units',
        enum: getUniqueLabels('UNITS', 'PaleoUnit')
    }
};

export const paleoVariableSchema: Record<string, SchemaField> = {
    standardVariable: {
        type: 'string',
        label: 'Standard Variable',
        enum: getUniqueLabels('VARIABLES', 'PaleoVariable')
    }
};

export const locationSchema: Record<string, SchemaField> = {
  latitude: { type: 'string', label: 'Latitude' },
  longitude: { type: 'string', label: 'Longitude' },  
  elevation: { type: 'string', label: 'Elevation' },  
  siteName: { type: 'string', label: 'Site Name' },  
  description: { type: 'string', label: 'Description' },    
  continent: { type: 'string', label: 'Continent' },
  country: { type: 'string', label: 'Country' },
  countryOcean: { type: 'string', label: 'Country Ocean' },
  ocean: { type: 'string', label: 'Ocean' },
  locationName: { type: 'string', label: 'Location Name' },
  locationType: { type: 'string', label: 'Location Type' }
};

export const personSchema: Record<string, SchemaField> = {
  name: { type: 'string', label: 'Name' }
};

export const publicationSchema: Record<string, SchemaField> = {
  title: { type: 'string', label: 'Title' },
  authors: {
    type: 'array',
    label: 'Authors',
    items: {
      type: 'object',
      label: 'Author',
      properties: personSchema
    }
  },
  year: { type: 'number', label: 'Year' },
  abstract: { type: 'string', label: 'Abstract' },  
  firstAuthor: {
    type: 'object',
    label: 'First Author',
    properties: personSchema
  },  
  dOI: { type: 'string', label: 'DOI' },  
  journal: { type: 'string', label: 'Journal' },
  volume: { type: 'string', label: 'Volume' },
  issue: { type: 'string', label: 'Issue' },
  pages: { type: 'string', label: 'Pages' },
  publisher: { type: 'string', label: 'Publisher' },
  citation: { type: 'string', label: 'Citation' },
  citeKey: { type: 'string', label: 'Cite Key' },
  institution: { type: 'string', label: 'Institution' },
  publicationType: { type: 'string', label: 'Publication Type' },
  report: { type: 'string', label: 'Report' },
  urls: {
    type: 'array',
    label: 'URLs',
    items: {
      type: 'string',
      label: 'URL'
    }
  },  
  dataUrls: {
    type: 'array',
    label: 'Data URLs',
    items: {
      type: 'string',
      label: 'URL'
    }
  }
};

export const changeLogSchema: Record<string, SchemaField> = {
  changes: { type: 'string', label: 'Changes' },
  notes: { type: 'string', label: 'Notes' }
};

export const fundingSchema: Record<string, SchemaField> = {
  fundingAgency: { type: 'string', label: 'Funding Agency' },
  fundingCountry: { type: 'string', label: 'Funding Country' },
  grants: {
    type: 'array',
    label: 'Grants',
    items: {
      type: 'string',
      label: 'Grant'
    }
  },
  investigators: {
    type: 'array',
    label: 'Investigators',
    items: {
      type: 'object',
      label: 'Investigator',
      properties: personSchema
    }
  }
};

export const interpretationSchema: Record<string, SchemaField> = {
    basis: { type: 'string', label: 'Basis' },    
    direction: { type: 'string', label: 'Direction' },  
    local: { type: 'string', label: 'Local' },  
    notes: { type: 'string', label: 'Notes' },  
    rank: { type: 'string', label: 'Rank' },
    scope: { type: 'string', label: 'Scope' },
    variable: { type: 'object', label: 'Interpretation Variable', properties: interpretationVariableSchema },
    variableDetail: { type: 'string', label: 'Variable Detail' },
    variableGeneral: { type: 'string', label: 'Variable General' },
    variableGeneralDirection: { type: 'string', label: 'Variable General Direction' },
    seasonality: { type: 'object', label: 'Seasonality', properties: seasonalitySchema },
    seasonalityGeneral: { type: 'object', label: 'Seasonality General', properties: seasonalitySchema },
    seasonalityOriginal: { type: 'object', label: 'Seasonality Original', properties: seasonalitySchema }
};

export const calibrationSchema: Record<string, SchemaField> = {
  dOI: { type: 'string', label: 'DOI' },
  datasetRange: { type: 'string', label: 'Dataset Range' },
  equation: { type: 'string', label: 'Equation' },
  equationIntercept: { type: 'string', label: 'Equation Intercept' },
  equationR2: { type: 'string', label: 'Equation R2' },
  equationSlope: { type: 'string', label: 'Equation Slope' },
  equationSlopeUncertainty: { type: 'string', label: 'Equation Slope Uncertainty' },
  method: { type: 'string', label: 'Method' },
  methodDetail: { type: 'string', label: 'Method Detail' },
  notes: { type: 'string', label: 'Notes' },
  proxyDataset: { type: 'string', label: 'Proxy Dataset' },
  seasonality: { type: 'string', label: 'Seasonality' },
  targetDataset: { type: 'string', label: 'Target Dataset' },
  uncertainty: { type: 'string', label: 'Uncertainty' }
};

export const resolutionSchema: Record<string, SchemaField> = {
  maxValue: { type: 'number', label: 'Max Value' },
  meanValue: { type: 'number', label: 'Mean Value' },
  medianValue: { type: 'number', label: 'Median Value' },
  minValue: { type: 'number', label: 'Min Value' },
  units: { type: 'object', label: 'Units', properties: paleoUnitSchema }
};

export const variableSchema: Record<string, SchemaField> = {
  name: { type: 'string', label: 'Name' },    
  standardVariable: { 
    type: 'object', 
    label: 'Standard Variable', 
    properties: paleoVariableSchema 
  },  
  variableId: { type: 'string', label: 'Variable ID' },
  variableType: { type: 'string', label: 'Variable Type' },  
  columnNumber: { type: 'number', label: 'Column Number' },  
  description: { type: 'string', label: 'Description' },  
  notes: { type: 'string', label: 'Notes' },  
  partOfCompilation: { type: 'string', label: 'Part of Compilation' },
  missingValue: { type: 'string', label: 'Missing Value' },  
  maxValue: { type: 'number', label: 'Max Value' },
  meanValue: { type: 'number', label: 'Mean Value' },
  medianValue: { type: 'number', label: 'Median Value' },
  minValue: { type: 'number', label: 'Min Value' },
  primary: { type: 'boolean', label: 'Primary' },
  uncertainty: { type: 'string', label: 'Uncertainty' },
  uncertaintyAnalytical: { type: 'string', label: 'Analytical Uncertainty' },
  uncertaintyReproducibility: { type: 'string', label: 'Reproducibility Uncertainty' },
  composite: { type: 'boolean', label: 'Composite' },
  instrument: { type: 'string', label: 'Instrument' },

  proxy: { type: 'object', label: 'Proxy', properties: proxySchema },
  proxyGeneral: { type: 'object', label: 'Proxy General', properties: proxyGeneralSchema },
  resolution: { type: 'object', label: 'Resolution', properties: resolutionSchema },
  archiveType: { 
    type: 'object', 
    label: 'Archive Type',
    properties: archiveTypeSchema
  },
  interpretations: { 
    type: 'array', 
    label: 'Interpretations', 
    items: { 
        type: 'object', 
        label: 'Interpretation', 
        properties: interpretationSchema 
    } 
  },
  calibratedVias: { 
    type: 'array', 
    label: 'Calibration', 
    items: { 
        type: 'object', 
        label: 'Calibration', 
        properties: calibrationSchema
    } 
  },   
};

export const dataTableSchema: Record<string, SchemaField> = {
  fileName: { type: 'string', label: 'File Name' },
  missingValue: { type: 'string', label: 'Missing Value' },
  variables: {
    type: 'array',
    label: 'Variables',
    items: {
      type: 'object',
      label: 'Variable',
      properties: variableSchema
    }
  }
};

export const modelSchema: Record<string, SchemaField> = {
  code: { type: 'string', label: 'Code', multiline: true, rows: 4 },
  ensembleTables: {
    type: 'array',
    label: 'Ensemble Tables',
    items: {
      type: 'object',
      label: 'Ensemble Table',
      properties: dataTableSchema
    }
  },
  summaryTables: {
    type: 'array',
    label: 'Summary Tables',
    items: {
      type: 'object',
      label: 'Summary Table',
      properties: dataTableSchema
    }
  },
  distributionTables: {
    type: 'array',
    label: 'Distribution Tables',
    items: {
      type: 'object',
      label: 'Distribution Table',
      properties: dataTableSchema
    }
  }
};

export const paleoDataSchema: Record<string, SchemaField> = {
  name: { type: 'string', label: 'Name' },
  // Measurement Tables and modeledBy are handled in the PaleoDataEditor component
  // measurementTables: {
  //   type: 'array',
  //   label: 'Measurement Tables',
  //   items: {
  //     type: 'object',
  //     label: 'Measurement Table',
  //     properties: dataTableSchema
  //   }
  // },
  // modeledBy: {
  //   type: 'array',
  //   label: 'Models',
  //   items: {
  //     type: 'object',
  //     label: 'Model',
  //     properties: modelSchema
  //   }
  // }
};

export const chronDataSchema: Record<string, SchemaField> = {
  // Measurement Tables and modeledBy are handled in the ChronDataEditor component
  // measurementTables: {
  //   type: 'array',
  //   label: 'Measurement Tables',
  //   items: {
  //     type: 'object',
  //     label: 'Measurement Table',
  //     properties: dataTableSchema
  //   }
  // },  
  // modeledBy: {
  //   type: 'array',
  //   label: 'Models',
  //   items: {
  //     type: 'object',
  //     label: 'Model',
  //     properties: modelSchema
  //   }
  // }
};

export const datasetSchema: Record<string, SchemaField> = {
  name: { type: 'string', label: 'Dataset Name' },
  archiveType: {
    type: 'object',
    label: 'Archive Type',
    properties: archiveTypeSchema
  },
  location: { 
    type: 'object', 
    label: 'Location',
    properties: locationSchema
  },
  datasetId: { type: 'string', label: 'Dataset ID' },
  version: { type: 'string', label: 'Version' },  
  collectionName: { type: 'string', label: 'Collection Name' },
  collectionYear: { type: 'string', label: 'Collection Year' },
  dataSource: { type: 'string', label: 'Data Source' },
  originalDataUrl: { type: 'string', label: 'Original Data URL' },
  spreadsheetLink: { type: 'string', label: 'Spreadsheet Link' },
  compilationNest: { type: 'string', label: 'Compilation Nest' },
  notes: { type: 'string', label: 'Notes' },
  changeLog: {
    type: 'object',
    label: 'Change Log',
    properties: changeLogSchema
  },
  investigators: {
    type: 'array',
    label: 'Investigators',
    items: {
      type: 'object',
      label: 'Investigator',
      properties: personSchema
    }
  },
  creators: {
    type: 'array',
    label: 'Creators',
    items: {
      type: 'object',
      label: 'Creator',
      properties: personSchema
    }
  },
  contributors: {
    type: 'array',
    label: 'Contributors',
    items: {
      type: 'object',
      label: 'Contributor',
      properties: personSchema
    }
  },
  fundings: {
    type: 'array',
    label: 'Fundings',
    items: {
      type: 'object',
      label: 'Funding',
      properties: fundingSchema
    }
  }
};

// Helper function to get schema for a class
export const getSchemaForClass = (className: string): Record<string, SchemaField> => {
  const schemas: Record<string, Record<string, SchemaField>> = {
    Dataset: datasetSchema,
    Publication: publicationSchema,
    Person: personSchema,
    Location: locationSchema,
    ArchiveType: archiveTypeSchema,
    ChangeLog: changeLogSchema,
    Funding: fundingSchema,
    Variable: variableSchema,
    DataTable: dataTableSchema,
    PaleoData: paleoDataSchema,
    ChronData: chronDataSchema,
    Resolution: resolutionSchema,
    Calibration: calibrationSchema,
    Interpretation: interpretationSchema,
    Model: modelSchema
  };
  return schemas[className] || {};
}; 