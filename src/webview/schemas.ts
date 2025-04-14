import { Dataset, Publication, Person, 
  Location, ArchiveType, ChangeLog, Funding, 
  Variable, DataTable, PaleoData, ChronData, 
  Resolution, Calibration, Interpretation, 
  Model, PaleoProxy, PaleoProxyGeneral, PaleoUnit,
  InterpretationVariable, InterpretationSeasonality,
  PaleoVariable, SynonymEntry, SYNONYMS } from "lipdjs";

  import { getPublicationTitleLabel, getPublicationAuthorsLabel,
    getPaleoDataLabel, getPaleoDataMeasurementTablesLabel,
    getDataTableLabel, getDataTableVariablesLabel,
    getPaleoDataModeledByLabel, getPersonNameLabel,
    getVariableNameLabel, getVariableDescriptionLabel
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
        locationName: { type: 'string', label: 'Location Name' },
        locationType: { type: 'string', label: 'Location Type' }
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

export const changeLogSchema: Schema = {
    fields: {
        changes: { type: 'string', label: 'Changes' },
        notes: { type: 'string', label: 'Notes' }
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

export const variableSchema: Schema = {
    fields: {
        name: { type: 'string', label: 'Name' },    
        standardVariable: { 
            type: 'enum', 
            label: 'Standard Variable', 
            schema: paleoVariableSchema 
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
        archiveType: { 
          type: 'enum', 
          label: 'Archive Type',
          schema: archiveTypeSchema
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

export const paleoDataSchema: Schema = {
    fields: {
        name: { type: 'string', label: 'Name' },
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
    class: PaleoData
};

export const chronDataSchema: Schema = {
  // Measurement Tables and modeledBy are handled in the ChronDataEditor component
  fields: {
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
    class: ChronData
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
    // changeLog: {
    //   type: 'object',
    //   label: 'Change Log',
    //   schema: changeLogSchema
    // },
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
    }
  },
  class: Dataset
};

// // Helper function to get schema for a class
// export const getSchemaForClass = (className: string): Schema => {
//   const schemas: Record<string, Schema> = {
//     Dataset: datasetSchema,
//     Publication: publicationSchema,
//     Person: personSchema,
//     Location: locationSchema,
//     ArchiveType: archiveTypeSchema,
//     ChangeLog: changeLogSchema,
//     Funding: fundingSchema,
//     Variable: variableSchema,
//     DataTable: dataTableSchema,
//     PaleoData: paleoDataSchema,
//     ChronData: chronDataSchema,
//     Resolution: resolutionSchema,
//     Calibration: calibrationSchema,
//     Interpretation: interpretationSchema,
//     Model: modelSchema,
//     PaleoProxy: proxySchema,
//     PaleoProxyGeneral: proxyGeneralSchema,
//     PaleoUnit: paleoUnitSchema,
//     PaleoVariable: paleoVariableSchema,
//     InterpretationVariable: interpretationVariableSchema,
//     InterpretationSeasonality: seasonalitySchema
//   };
//   return schemas[className] || {};
// }; 