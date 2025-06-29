import { Dataset, Publication, Person, 
  Location, ArchiveType, ChangeLog, Funding, 
  Variable, DataTable, PaleoData, ChronData, 
  Resolution, Calibration, Interpretation, Change,
  Model, PaleoProxy, PaleoProxyGeneral, PaleoUnit,
  InterpretationVariable, InterpretationSeasonality,
  PaleoVariable, SynonymEntry, SYNONYMS, Compilation } from "lipdjs";

  import { getPublicationTitleLabel, getPublicationAuthorsLabel,
    getDataDetailsLabel,
    getDataTableLabel, getDataTableVariablesLabel,
    getPersonNameLabel,
    getVariableNameLabel, getVariableDescriptionLabel,
    getFundingGrantsLabel,
    getFundingLabel,
    getChangeLogLabel,
    getChangeLogCuratorLabel,
    getChangeLogEntryLabel,
    getCompilationNameLabel
   } from "../utils/labels";

export interface Schema {
  fields?: Record<string, SchemaField>;
  enum?: Record<string, SynonymEntry>;
  class?: any;
  label?: {
    primary?: Function;
    secondary?: Function;
  };
}

export interface SchemaField {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum';
    hidden?: boolean;
    label?: string;
    multiline?: boolean;
    rows?: number;
    items?: SchemaField;
    schema?: Schema;
}

// Helper function to get unique labels from SYNONYMS
const getUniqueLabels = (category: string, className: string): Record<string, SynonymEntry> => {
    const categoryObj = SYNONYMS[category as keyof typeof SYNONYMS];
    if (!categoryObj) return {};
    
    const synonyms = categoryObj[className as keyof typeof categoryObj];
    if (!synonyms) return {};
    
    const uniqueLabels: Record<string, SynonymEntry> = {};
    Object.values(synonyms).forEach((entry: any) => {
        if (entry?.id) {
            uniqueLabels[entry.id] = entry;
        }
    });
    return uniqueLabels;
};

export const archiveTypeSchema: Schema = {
    enum: getUniqueLabels('ARCHIVES', 'ArchiveType'),
    class: ArchiveType
};

export const proxySchema: Schema = {
    enum: getUniqueLabels('PROXIES', 'PaleoProxy'),
    class: PaleoProxy
};

export const proxyGeneralSchema: Schema = {
    enum: getUniqueLabels('PROXIES', 'PaleoProxyGeneral'),
    class: PaleoProxyGeneral
};

export const interpretationVariableSchema: Schema = {
    enum: getUniqueLabels('INTERPRETATION', 'InterpretationVariable'),
    class: InterpretationVariable
};

export const seasonalitySchema: Schema = {
    enum: getUniqueLabels('INTERPRETATION', 'InterpretationSeasonality'),
    class: InterpretationSeasonality
};

export const seasonalityGeneralSchema: Schema = {
    enum: getUniqueLabels('INTERPRETATION', 'InterpretationSeasonality'),
    class: InterpretationSeasonality
};

export const seasonalityOriginalSchema: Schema = {
    enum: getUniqueLabels('INTERPRETATION', 'InterpretationSeasonality'),
    class: InterpretationSeasonality
};

export const paleoUnitSchema: Schema = {
    enum: getUniqueLabels('UNITS', 'PaleoUnit'),
    class: PaleoUnit  
};

export const paleoVariableSchema: Schema = {
    enum: getUniqueLabels('VARIABLES', 'PaleoVariable'),
    class: PaleoVariable
};

export const locationSchema: Schema = {
    fields: {
        latitude: { type: 'string', label: 'Latitude' },
        longitude: { type: 'string', label: 'Longitude' },  
        elevation: { type: 'string', label: 'Elevation' },  
        siteName: { type: 'string', label: 'Site Name' },  
        description: { type: 'string', label: 'Description' },    
        continent: { type: 'string', label: 'Continent' },
        country: { type: 'string', label: 'Country' },
        countryOcean: { type: 'string', label: 'Country Ocean' },
        ocean: { type: 'string', label: 'Ocean' },
        // locationName: { type: 'string', label: 'Location Name' },
        // locationType: { type: 'string', label: 'Location Type' }
    },
    class: Location
};

export const personSchema: Schema = {
    fields: {
        name: { type: 'string', label: 'Name' }
    },
    label: {
      primary: getPersonNameLabel
    },
    class: Person
};

export const publicationSchema: Schema = {
    fields: {
        title: { type: 'string', label: 'Title' },
        authors: {
          type: 'array',
          label: 'Authors',
          items: {
            type: 'object',
            label: 'Author',
            schema: personSchema
          }
        },
        year: { type: 'number', label: 'Year' },
        abstract: { type: 'string', label: 'Abstract' },  
        firstAuthor: {
            type: 'object',
            hidden: true,
            label: 'First Author',
            schema: personSchema
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
    },
    label: {
      primary: getPublicationTitleLabel,
      secondary: getPublicationAuthorsLabel
    },    
    class: Publication
};

export const changeLogEntrySchema: Schema = {
  fields: {
      name: { type: 'string', label: 'Name' },
      notes: { 
        type: 'array',
        label: 'Notes',
        items: {
          type: 'string',
          label: 'Note'
        }
      }
  },
  label: {
    primary: getChangeLogEntryLabel
  },
  class: Change
};

export const changeLogSchema: Schema = {
    fields: {
        curator: {type: 'string', label: 'Curator'},
        timestamp: {type: 'string', label: 'Timestamp'},
        version: {type: 'string', label: 'Version'},
        lastVersion: {type: 'string', label: 'Last Version'},
        notes: {type: 'string', label: 'Notes'},
        changes: { 
          type: 'array', 
          label: 'Changes',
          items: {
            type: 'object',
            label: 'Change',
            schema: changeLogEntrySchema
          }
        },
    },
    label: {
      primary: getChangeLogLabel,
      secondary: getChangeLogCuratorLabel
    },
    class: ChangeLog
};

export const fundingSchema: Schema = {
    fields: {
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
            schema: personSchema
          }
        }
    },
    label: {
      primary: getFundingLabel,
      secondary: getFundingGrantsLabel
    },
    class: Funding
};

export const interpretationSchema: Schema = {
    fields: {
        basis: { type: 'string', label: 'Basis' },    
        direction: { type: 'string', label: 'Direction' },  
        local: { type: 'string', label: 'Local' },  
        notes: { type: 'string', label: 'Notes' },  
        rank: { type: 'string', label: 'Rank' },
        scope: { type: 'string', label: 'Scope' },
        variable: { 
          type: 'enum', 
          label: 'Interpretation Variable', 
          schema: interpretationVariableSchema 
        },
        variableDetail: { type: 'string', label: 'Variable Detail' },
        variableGeneral: { type: 'string', label: 'Variable General' },
        variableGeneralDirection: { type: 'string', label: 'Variable General Direction' },
        seasonality: { 
          type: 'enum', 
          label: 'Seasonality', 
          schema: seasonalitySchema 
        },
        seasonalityGeneral: { 
          type: 'enum', 
          label: 'Seasonality General', 
          schema: seasonalitySchema 
        },
        seasonalityOriginal: { 
          type: 'enum', 
          label: 'Seasonality Original', 
          schema: seasonalitySchema 
        }
    },
    class: Interpretation
};

export const calibrationSchema: Schema = {
    fields: {
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
    },
    class: Calibration
};

export const resolutionSchema: Schema = {
    fields: {
        maxValue: { type: 'number', label: 'Max Value' },
        meanValue: { type: 'number', label: 'Mean Value' },
        medianValue: { type: 'number', label: 'Median Value' },
        minValue: { type: 'number', label: 'Min Value' },
        units: { type: 'enum', label: 'Units', schema: paleoUnitSchema }
    },
    class: Resolution
};

export const compilationSchema: Schema = {
    fields: {
        name: { type: 'string', label: 'Name' },
        version: { type: 'string', label: 'Version' },
    },
    label: {
      primary: getCompilationNameLabel
    },
    class: Compilation
};

export const variableSchema: Schema = {
    fields: {
        name: { type: 'string', label: 'Name' },    
        standardVariable: { 
            type: 'enum', 
            label: 'Standard Variable', 
            schema: paleoVariableSchema 
        },  
        variableId: { type: 'string', label: 'Variable ID' },
        description: { type: 'string', label: 'Description' },
        notes: { type: 'string', label: 'Notes' },
        units: { type: 'enum', label: 'Units', schema: paleoUnitSchema },
        archiveType: { 
          type: 'enum', 
          label: 'Archive Type',
          schema: archiveTypeSchema
        },
        columnNumber: { type: 'number', label: 'Column Number' },
        variableType: { type: 'string', label: 'Variable Type' },
        partOfCompilations: { 
          type: 'array', 
          label: 'Part of Compilations',
          items: {
            type: 'object',
            label: 'Compilation',
            schema: compilationSchema
          }
        },
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

        proxy: { 
          type: 'enum', 
          label: 'Proxy', 
          schema: proxySchema 
        },
        proxyGeneral: { 
          type: 'enum', 
          label: 'Proxy General', 
          schema: proxyGeneralSchema 
        },
        resolution: { 
          type: 'object', 
          label: 'Resolution', 
          schema: resolutionSchema 
        },
        interpretations: { 
          type: 'array', 
          label: 'Interpretations', 
          items: { 
              type: 'object', 
              label: 'Interpretation', 
              schema: interpretationSchema 
          } 
        },
        calibratedVias: { 
          type: 'array', 
          label: 'Calibration', 
          items: { 
              type: 'object', 
              label: 'Calibration', 
              schema: calibrationSchema
          } 
        }
    },
    label: {
      primary: getVariableNameLabel,
      secondary: getVariableDescriptionLabel
    }, 
    class: Variable
};

export const dataTableSchema: Schema = {
    fields: {
        fileName: { type: 'string', label: 'File Name' },
        missingValue: { type: 'string', label: 'Missing Value' },
        variables: {
            type: 'array',
            label: 'Variables',
            items: {
                type: 'object',
                label: 'Variable',
                schema: variableSchema
            }
        }
    },
    label: {
      primary: getDataTableLabel,
      secondary: getDataTableVariablesLabel
    },
    class: DataTable
};

export const modelSchema: Schema = {
    fields: {
        code: { type: 'string', label: 'Code', multiline: true, rows: 4 },
        ensembleTables: {
            type: 'array',
            label: 'Ensemble Tables',
            items: {
                type: 'object',
                label: 'Ensemble Table',
                schema: dataTableSchema
            }
        },
        summaryTables: {
            type: 'array',
            label: 'Summary Tables',
            items: {
                type: 'object',
                label: 'Summary Table',
                schema: dataTableSchema
            }
        },
        distributionTables: {
            type: 'array',
            label: 'Distribution Tables',
            items: {
                type: 'object',
                label: 'Distribution Table',
                schema: dataTableSchema
            }
        }
    },
    class: Model
};

export const dataSchema: Schema = {
    fields: {
        // name: { type: 'string', label: 'Name' },
        // Measurement Tables and modeledBy are handled in the PaleoDataEditor component
        measurementTables: {
          type: 'array',
          label: 'Measurement Tables',
          items: {
                type: 'object',
                label: 'Measurement Table',
                schema: dataTableSchema
            }
        },
        modeledBy: {
          type: 'array',
          label: 'Models',
          items: {
                type: 'object',
                label: 'Model',
                schema: modelSchema
          }
        }
    },
    label: {
      secondary: getDataDetailsLabel
    },    
    class: PaleoData
};

export const datasetSchema: Schema = {
  fields: {
    name: { type: 'string', label: 'Dataset Name' },
    archiveType: {
      type: 'enum',
      label: 'Archive Type',
      schema: archiveTypeSchema
    },
    location: { 
      hidden: true,
      type: 'object', 
      label: 'Location',
      schema: locationSchema
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
    investigators: {
      type: 'array',
      label: 'Investigators',
      items: {
        type: 'object',
        label: 'Investigator',
        schema: personSchema
      }
    },
    creators: {
      type: 'array',
      label: 'Creators',
      items: {
        type: 'object',
        label: 'Creator',
        schema: personSchema
      }
    },
    contributors: {
      type: 'array',
      label: 'Contributors',
      items: {
        type: 'object',
        label: 'Contributor',
        schema: personSchema
      }
    },
    fundings: {
      type: 'array',
      label: 'Fundings',
      items: {
        type: 'object',
        label: 'Funding',
        schema: fundingSchema
      }
    },
    changeLogs: {
      type: 'array',
      hidden: true,
      label: 'ChangeLog',
      items: {
        type: 'object',
        label: 'ChangeLog Entry',
        schema: changeLogSchema
      }
    },
    publications: {
      type: 'array',
      hidden: true,
      label: 'Publications',
      items: {
        type: 'object',
        label: 'Publication',
        schema: publicationSchema
      }      
    },
    paleoData: {
      type: 'array',
      hidden: true,
      label: 'PaleoData',
      items: {
        type: 'object',
        label: 'PaleoData',
        schema: dataSchema
      }
    },
    chronData: {
      type: 'array',
      hidden: true,
      label: 'ChronData',
      items: {
        type: 'object',
        label: 'ChronData',
        schema: dataSchema
      }
    }    
  },
  class: Dataset
};



// Build a complete map of paths to schemas
const schemaPathMap: Map<string, Schema | SchemaField> = new Map();

// Function to recursively build the schema path map
const buildSchemaPathMap = (
    schema: Schema | undefined,
    fieldSchema: SchemaField | undefined,
    currentPath: string = 'dataset'
) => {
    // Add the current schema to the map
    if (schema) {
        schemaPathMap.set(currentPath, schema);

        // Process fields in the schema
        if (schema.fields) {
            Object.entries(schema.fields).forEach(([fieldName, fieldDef]) => {
                const fieldPath = `${currentPath}.${fieldName}`;
                schemaPathMap.set(fieldPath, fieldDef);

                // If field is an object with its own schema, recursively process it
                if (fieldDef.type === 'object' && fieldDef.schema) {
                    buildSchemaPathMap(fieldDef.schema, fieldDef, fieldPath);
                }
                // If field is an array with item schema, process the array items schema
                else if (fieldDef.type === 'array' && fieldDef.items) {
                    // Map the array itself
                    schemaPathMap.set(fieldPath, fieldDef);
                    
                    // The schema for individual items in the array (with wildcard index)
                    const itemPath = `${fieldPath}.*`;
                    schemaPathMap.set(itemPath, fieldDef.items);
                    
                    // If array items have a schema, recursively process it
                    if (fieldDef.items.schema) {
                        buildSchemaPathMap(fieldDef.items.schema, fieldDef.items, itemPath);
                    }
                }
            });
        }
    }
    // If we're starting with a field schema instead of a full schema
    else if (fieldSchema) {
        schemaPathMap.set(currentPath, fieldSchema);
        
        if (fieldSchema.type === 'object' && fieldSchema.schema) {
            buildSchemaPathMap(fieldSchema.schema, undefined, currentPath);
        }
        else if (fieldSchema.type === 'array' && fieldSchema.items) {
            const itemPath = `${currentPath}.*`;
            schemaPathMap.set(itemPath, fieldSchema.items);
            
            if (fieldSchema.items.schema) {
                buildSchemaPathMap(fieldSchema.items.schema, fieldSchema.items, itemPath);
            }
        }
    }
};

// Initialize the schema path map
buildSchemaPathMap(datasetSchema, undefined);

// Helper function to find the schema for a given path
export const getSchemaForPath = (path: string): Schema | SchemaField | null => {
  // Try exact match first
  if (schemaPathMap.has(path)) {
      return schemaPathMap.get(path) as Schema | SchemaField;
  }

  // Check for wildcard path
  let wildcardPath = path.replace(/\.\d+/g, '.*');
  if (schemaPathMap.has(wildcardPath)) {
      return schemaPathMap.get(wildcardPath) as Schema | SchemaField;
  }
  
  return null;
};