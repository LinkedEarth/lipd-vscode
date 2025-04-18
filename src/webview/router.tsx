import React, { useContext, useCallback, useMemo } from 'react';
import { useLiPDStore } from './store';
import { DataTableEditor } from './components/DataTableEditor';
import { datasetSchema, dataTableSchema, dataSchema, modelSchema, publicationSchema, Schema, variableSchema, fundingSchema, interpretationSchema, calibrationSchema, changeLogSchema, changeLogEntrySchema, SchemaField, personSchema, locationSchema } from './schemas';
import { DefaultListEditor } from './components/DefaultListEditor';
import { DefaultEditor } from './components/DefaultEditor';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Dataset } from 'lipdjs';
import { 
  getPersonNameLabel, 
  getPublicationTitleLabel, 
  getDataTableLabel, 
  getVariableNameLabel,
  getFundingLabel
} from '../utils/labels';

// Define route types
interface Route {
  path: string;
  component: React.ComponentType<any>;
  schema?: Schema;
  getParams?: (path: string) => RouteParams | null;
  label: string | ((params: RouteParams) => string);  
  title?: string | ((params: RouteParams) => string);
  itemLabel?: (item: any) => string;
}

// Define route parameters
export interface RouteParams {
  dataType?: string;
  index?: number;
  tableIndex?: number;
  varIndex?: number;
  interpretationIndex?: number;
  calibrationIndex?: number;
  publicationIndex?: number;
  fundingIndex?: number;
  modelIndex?: number;
  tableType?: string;
  changeLogIndex?: number;
  changeLogEntryIndex?: number;
  personIndex?: number;
  authorIndex?: number;
  investigatorIndex?: number;
}

// Define the router context
interface RouterContextType {
  currentPath: string;
  navigateTo: (path: string) => void;
  goBack: () => void;
  breadcrumbs: { label: string; path: string }[];
  canGoBack: boolean;
}

// Editor props interface
export interface EditorProps {
  dataset: Dataset;
  path: string;
  title?: string;
  params?: RouteParams;
  onUpdate: (path: string, updatedObject: any) => void;
  schema?: Schema;
  fieldSchema?: SchemaField;
  columns?: number;
  dense?: boolean;
  useFieldset?: boolean;
}

const RouterContext = React.createContext<RouterContextType | null>(null);

// Define routes
const routes: Route[] = [
  {
    path: 'dataset',
    component: DefaultEditor,
    label: 'Dataset',
    title: 'Dataset',
    itemLabel: dataset => dataset.name || 'Dataset',
    schema: datasetSchema
  },
  // PaleoData or ChronData
  {
    path: 'dataset/:dataType',
    component: DefaultListEditor,
    label: params => `${(params.dataType || ' ').charAt(0).toUpperCase() + params.dataType?.slice(1)}`,
    title: params => `${(params.dataType || ' ').charAt(0).toUpperCase() + params.dataType?.slice(1)}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.(paleoData|chronData)$/);
      return match ? { dataType: match[1] } : null;
    },
    schema: dataSchema
  },
  // PaleoData or ChronData
  {
    path: 'dataset/:dataType/:index',
    component: DefaultEditor,
    title: params => `${(params.dataType || ' ').charAt(0).toUpperCase() + params.dataType?.slice(1)} ${Number(params.index) + 1}`,
    label: params => `${(params.dataType || ' ').charAt(0).toUpperCase() + params.dataType?.slice(1)} ${Number(params.index) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.(paleoData|chronData)\.(\d+)$/);
      return match ? { 
        dataType: match[1],
        index: parseInt(match[2]) 
      } : null;
    },
    schema: dataSchema
  },
  // Publications List
  {
    path: 'dataset/publications',
    component: DefaultListEditor,
    label: 'Publications',
    title: 'Publications',
    schema: publicationSchema,
    getParams: (path) => {
      const match = path.match(/^dataset\.publications$/);
      return match ? {} : null;
    },
  },
  // Publication
  {
    path: 'dataset/publications/:index',
    component: DefaultEditor,
    title: 'Publication',
    label: params => `Publication ${Number(params.publicationIndex) + 1}`,
    itemLabel: publication => getPublicationTitleLabel(publication),
    getParams: (path) => {
      const match = path.match(/^dataset\.publications\.(\d+)$/);
      return match ? { 
        publicationIndex: parseInt(match[1]) 
      } : null;
    },
    schema: publicationSchema
  },
  // Location
  {
    path: 'dataset/location',
    component: DefaultEditor,
    label: 'Location',
    title: 'Location',
    itemLabel: () => 'Location',
    getParams: (path) => {
      const match = path.match(/^dataset\.location$/);
      return match ? {} : null;
    },
    schema: locationSchema
  },  
  // ChangeLog List
  {
    path: 'dataset/changeLogs',
    component: DefaultListEditor,
    label: 'ChangeLogs',
    title: 'ChangeLogs',
    schema: changeLogSchema,
    getParams: (path) => {
      const match = path.match(/^dataset\.changeLogs$/);
      return match ? {} : null;
    },
  },
  // ChangeLog
  {
    path: 'dataset/changeLogs/:index',
    component: DefaultEditor,
    title: 'ChangeLog',
    label: params => `ChangeLog ${Number(params.changeLogIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.changeLogs\.(\d+)$/);
      return match ? { 
        changeLogIndex: parseInt(match[1]) 
      } : null;
    },
    schema: changeLogSchema
  },
  // ChangeLogEntry
  {
    path: 'dataset/changeLogs/:index/changes/:changeLogEntryIndex',
    component: DefaultEditor,
    title: 'ChangeLogEntry',
    label: params => `ChangeLogEntry ${Number(params.changeLogEntryIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.changeLogs\.(\d+)\.changes\.(\d+)$/);
      return match ? { 
        changeLogIndex: parseInt(match[1]),
        changeLogEntryIndex: parseInt(match[2])
      } : null;
    },
    schema: changeLogEntrySchema
  },  
  // Fundings List
  {
    path: 'dataset/fundings',
    component: DefaultListEditor,
    label: 'Fundings',
    title: 'Fundings',
    schema: fundingSchema,
    getParams: (path) => {
      const match = path.match(/^dataset\.fundings$/);
      return match ? {} : null;
    },
  },
  // Funding
  {
    path: 'dataset/fundings/:index',
    component: DefaultEditor,
    title: 'Funding',
    label: params => `Funding ${Number(params.fundingIndex) + 1}`,
    itemLabel: funding => getFundingLabel(funding),
    getParams: (path) => {
      const match = path.match(/^dataset\.fundings\.(\d+)$/);
      return match ? { 
        fundingIndex: parseInt(match[1]) 
      } : null;
    },
    schema: fundingSchema
  },  
  // PaleoData or ChronData measurement Tables
  {
    path: 'dataset/:dataType/:index/measurementTables/:tableIndex',
    component: DataTableEditor,
    title: 'Data Table',
    label: params => `Measurement Table ${Number(params.tableIndex) + 1}`,
    itemLabel: table => getDataTableLabel(table),
    getParams: (path) => {
      const match = path.match(/^dataset\.(paleoData|chronData)\.(\d+)\.measurementTables\.(\d+)$/);
      return match ? { 
        dataType: match[1],
        index: parseInt(match[2]), 
        tableIndex: parseInt(match[3]) 
      } : null;
    },
    schema: dataTableSchema
  },
  // PaleoData or ChronData measurement Tables variables
  {
    path: 'dataset/:dataType/:index/measurementTables/:tableIndex/variables/:varIndex',
    component: DefaultEditor,
    title: 'Variable',
    label: params => `Variable ${Number(params.varIndex) + 1}`,
    itemLabel: variable => getVariableNameLabel(variable),
    getParams: (path) => {
      const match = path.match(/^dataset\.(paleoData|chronData)\.(\d+)\.measurementTables\.(\d+)\.variables\.(\d+)$/);
      return match ? { 
        dataType: match[1],
        index: parseInt(match[2]), 
        tableIndex: parseInt(match[3]),
        varIndex: parseInt(match[4])
      } : null;
    },
    schema: variableSchema
  },
  // PaleoData or ChronData measurement Tables variables interpretations
  {
    path: 'dataset/:dataType/:index/measurementTables/:tableIndex/variables/:varIndex/interpretations/:interpretationIndex',
    component: DefaultEditor,
    title: 'Interpretation',
    label: params => `Interpretation ${Number(params.interpretationIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.(paleoData|chronData)\.(\d+)\.measurementTables\.(\d+)\.variables\.(\d+)\.interpretations\.(\d+)$/);
      return match ? { 
        dataType: match[1],
        index: parseInt(match[2]), 
        tableIndex: parseInt(match[3]),
        varIndex: parseInt(match[4]),
        interpretationIndex: parseInt(match[5])
      } : null;
    },
    schema: interpretationSchema
  }, 
  // PaleoData or ChronData measurement Tables variables calibrations
  {
    path: 'dataset/:dataType/:index/measurementTables/:tableIndex/variables/:varIndex/calibrations/:calibrationIndex',
    component: DefaultEditor,
    title: 'Calibration',
    label: params => `Calibration ${Number(params.calibrationIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.(paleoData|chronData)\.(\d+)\.measurementTables\.(\d+)\.variables\.(\d+)\.calibratedVias\.(\d+)$/);
      return match ? { 
        dataType: match[1],
        index: parseInt(match[2]), 
        tableIndex: parseInt(match[3]),
        varIndex: parseInt(match[4]),
        calibrationIndex: parseInt(match[5])
      } : null;
    },
    schema: calibrationSchema
  },    
  // PaleoData or ChronData models
  {
    path: 'dataset/:dataType/:index/modeledBy/:modelIndex',
    component: DefaultEditor,
    title: 'Model',
    label: params => `Model ${Number(params.modelIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.(paleoData|chronData)\.(\d+)\.modeledBy\.(\d+)$/);
      return match ? { 
        dataType: match[1],
        index: parseInt(match[2]), 
        modelIndex: parseInt(match[3]) 
      } : null;
    },
    schema: modelSchema
  },  
  // PaleoData or ChronData modeledBy Tables
  {
    path: 'dataset/:dataType/:index/modeledBy/:modelIndex/:tableType/:tableIndex',
    component: DataTableEditor,
    title: 'Data Table',
    label: params => `Summary Table ${Number(params.tableIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.(paleoData|chronData)\.(\d+)\.modeledBy\.(\d+)\.(summaryTables|ensembleTables|distributionTables)\.(\d+)$/);
      return match ? { 
        dataType: match[1],
        index: parseInt(match[2]), 
        modelIndex: parseInt(match[3]),
        tableType: match[4],
        tableIndex: parseInt(match[5]) 
      } : null;
    },
    schema: dataTableSchema
  }, 
  // ChronData or PaleoData modeledBy Tables variables
  {
    path: 'dataset/:dataType/:index/modeledBy/:modelIndex/:tableType/:tableIndex/variables/:varIndex',
    component: DefaultEditor,
    title: 'Variable',
    label: params => `Variable ${Number(params.varIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.(paleoData|chronData)\.(\d+)\.modeledBy\.(\d+)\.(summaryTables|ensembleTables|distributionTables)\.(\d+)\.variables\.(\d+)$/);
      return match ? { 
        dataType: match[1],
        index: parseInt(match[2]), 
        modelIndex: parseInt(match[3]),
        tableType: match[4],
        tableIndex: parseInt(match[5]),
        varIndex: parseInt(match[6])
      } : null;
    },
    schema: variableSchema
  },
  // PaleoData or ChronData modeledBy Tables variables interpretations
  {
    path: 'dataset/:dataType/:index/modeledBy/:modelIndex/:tableType/:tableIndex/variables/:varIndex/interpretations/:interpretationIndex',
    component: DefaultEditor,
    title: 'Interpretation',
    label: params => `Interpretation ${Number(params.interpretationIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.(paleoData|chronData)\.(\d+)\.modeledBy\.(\d+)\.(summaryTables|ensembleTables|distributionTables)\.(\d+)\.variables\.(\d+)\.interpretations\.(\d+)$/);
      return match ? { 
        dataType: match[1],
        index: parseInt(match[2]), 
        modelIndex: parseInt(match[3]),
        tableType: match[4],
        tableIndex: parseInt(match[5]),
        varIndex: parseInt(match[6]),
        interpretationIndex: parseInt(match[7])
      } : null;
    },
    schema: interpretationSchema
  }, 
  // PaleoData or ChronData modeledBy Tables variables calibrations
  {
    path: 'dataset/:dataType/:index/modeledBy/:modelIndex/:tableType/:tableIndex/variables/:varIndex/calibrations/:calibrationIndex',
    component: DefaultEditor,
    title: 'Calibration',
    label: params => `Calibration ${Number(params.calibrationIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.(paleoData|chronData)\.(\d+)\.modeledBy\.(\d+)\.(summaryTables|ensembleTables|distributionTables)\.(\d+)\.variables\.(\d+)\.calibratedVias\.(\d+)$/);
      return match ? { 
        dataType: match[1],
        index: parseInt(match[2]), 
        modelIndex: parseInt(match[3]),
        tableType: match[4],
        tableIndex: parseInt(match[5]),
        varIndex: parseInt(match[6]),
        calibrationIndex: parseInt(match[7])
      } : null;
    },
    schema: calibrationSchema
  },     
  // ===== PERSON ROUTES =====
  
  // Dataset Investigators List
  {
    path: 'dataset/investigators',
    component: DefaultListEditor,
    label: 'Investigators',
    title: 'Investigators',
    schema: personSchema,
    getParams: (path) => {
      const match = path.match(/^dataset\.investigators$/);
      return match ? {} : null;
    },
  },
  // Dataset Investigator
  {
    path: 'dataset/investigators/:index',
    component: DefaultEditor,
    title: 'Investigator',
    label: params => `Investigator ${Number(params.personIndex) + 1}`,
    itemLabel: person => getPersonNameLabel(person),
    getParams: (path) => {
      const match = path.match(/^dataset\.investigators\.(\d+)$/);
      return match ? { 
        personIndex: parseInt(match[1]) 
      } : null;
    },
    schema: personSchema
  },
  
  // Dataset Creators List
  {
    path: 'dataset/creators',
    component: DefaultListEditor,
    label: 'Creators',
    title: 'Creators',
    schema: personSchema,
    getParams: (path) => {
      const match = path.match(/^dataset\.creators$/);
      return match ? {} : null;
    },
  },
  // Dataset Creator
  {
    path: 'dataset/creators/:index',
    component: DefaultEditor,
    title: 'Creator',
    label: params => `Creator ${Number(params.personIndex) + 1}`,
    itemLabel: person => getPersonNameLabel(person),
    getParams: (path) => {
      const match = path.match(/^dataset\.creators\.(\d+)$/);
      return match ? { 
        personIndex: parseInt(match[1]) 
      } : null;
    },
    schema: personSchema
  },
  
  // Dataset Contributors List
  {
    path: 'dataset/contributors',
    component: DefaultListEditor,
    label: 'Contributors',
    title: 'Contributors',
    schema: personSchema,
    getParams: (path) => {
      const match = path.match(/^dataset\.contributors$/);
      return match ? {} : null;
    },
  },
  // Dataset Contributor
  {
    path: 'dataset/contributors/:index',
    component: DefaultEditor,
    title: 'Contributor',
    label: params => `Contributor ${Number(params.personIndex) + 1}`,
    itemLabel: person => getPersonNameLabel(person),
    getParams: (path) => {
      const match = path.match(/^dataset\.contributors\.(\d+)$/);
      return match ? { 
        personIndex: parseInt(match[1]) 
      } : null;
    },
    schema: personSchema
  },
  
  // Publication Authors List
  {
    path: 'dataset/publications/:publicationIndex/authors',
    component: DefaultListEditor,
    label: 'Authors',
    title: 'Authors',
    schema: personSchema,
    getParams: (path) => {
      const match = path.match(/^dataset\.publications\.(\d+)\.authors$/);
      return match ? { 
        publicationIndex: parseInt(match[1]) 
      } : null;
    },
  },
  // Publication Author
  {
    path: 'dataset/publications/:publicationIndex/authors/:authorIndex',
    component: DefaultEditor,
    title: 'Author',
    label: params => `Author ${Number(params.authorIndex) + 1}`,
    itemLabel: person => getPersonNameLabel(person),
    getParams: (path) => {
      const match = path.match(/^dataset\.publications\.(\d+)\.authors\.(\d+)$/);
      return match ? { 
        publicationIndex: parseInt(match[1]),
        authorIndex: parseInt(match[2])
      } : null;
    },
    schema: personSchema
  },
  
  // Publication First Author
  {
    path: 'dataset/publications/:publicationIndex/firstAuthor',
    component: DefaultEditor,
    title: 'First Author',
    label: 'First Author',
    itemLabel: person => getPersonNameLabel(person),
    getParams: (path) => {
      const match = path.match(/^dataset\.publications\.(\d+)\.firstAuthor$/);
      return match ? { 
        publicationIndex: parseInt(match[1])
      } : null;
    },
    schema: personSchema
  },
  
  // Funding Investigators List
  {
    path: 'dataset/fundings/:fundingIndex/investigators',
    component: DefaultListEditor,
    label: 'Investigators',
    title: 'Investigators',
    schema: personSchema,
    getParams: (path) => {
      const match = path.match(/^dataset\.fundings\.(\d+)\.investigators$/);
      return match ? { 
        fundingIndex: parseInt(match[1]) 
      } : null;
    },
  },
  // Funding Investigator
  {
    path: 'dataset/fundings/:fundingIndex/investigators/:investigatorIndex',
    component: DefaultEditor,
    title: 'Investigator',
    label: params => `Investigator ${Number(params.investigatorIndex) + 1}`,
    itemLabel: person => getPersonNameLabel(person),
    getParams: (path) => {
      const match = path.match(/^dataset\.fundings\.(\d+)\.investigators\.(\d+)$/);
      return match ? { 
        fundingIndex: parseInt(match[1]),
        investigatorIndex: parseInt(match[2])
      } : null;
    },
    schema: personSchema
  },
];

// Find matching route for a path
const findMatchingRoute = (path: string): { route: Route; params: RouteParams; schema: Schema } | null => {
  // console.log('Finding matching route for path:', path);
  for (const route of routes) {
    if (route.getParams) {
      const params = route.getParams(path);
      if (params) {
        // console.log('Found matching route:', route.path, 'with params:', params);
        return { route, params, schema: route.schema || {} };
      }
    } else if (route.path === path) {
      // console.log('Found matching route:', route.path, 'with params:', {});
      return { route, params: {}, schema: route.schema || {} };
    }
  }
  return null;
};

// Generate breadcrumbs for a path
const generateBreadcrumbs = (path: string): { label: string; path: string }[] => {
  const parts = path.split('.');
  const breadcrumbs: { label: string; path: string }[] = [];
  
  let currentPath = '';
  for (let i = 0; i < parts.length; i++) {
    currentPath = currentPath ? `${currentPath}.${parts[i]}` : parts[i];
    const match = findMatchingRoute(currentPath);
    
    if (match) {
      const { route, params } = match;
      let label;
      
      // Try to use the itemLabel function if available
      if (route.itemLabel) {
        // Get the actual item at this path
        const dataset = useLiPDStore.getState().dataset;
        const item = getItemFromPath(dataset, currentPath);
        if (item) {
          label = route.itemLabel(item);
        }
      }
      
      // Fall back to the regular label if itemLabel didn't work
      if (!label) {
        label = typeof route.label === 'function' ? route.label(params) : route.label;
      }
      
      breadcrumbs.push({ label, path: currentPath });
    }
  }
  
  return breadcrumbs;
};

// Helper to get the actual item from a path
const getItemFromPath = (dataset: any, path: string): any => {
  if (!dataset || !path) return null;
  
  // For just 'dataset', return the whole dataset
  if (path === 'dataset') return dataset;
  
  // Remove 'dataset.' prefix if present
  const normalizedPath = path.startsWith('dataset.') ? path.substring(8) : path;
  
  // Split into parts and traverse
  const parts = normalizedPath.split('.');
  let current = dataset;
  
  for (const part of parts) {
    if (!current || current[part] === undefined) {
      return null;
    }
    current = current[part];
  }
  
  return current;
};

// Router provider component
export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedNode, setSelectedNode, dataset } = useLiPDStore((state) => ({
    selectedNode: state.selectedNode,
    setSelectedNode: state.setSelectedNode,
    dataset: state.dataset
  }));

  // Add navigation history state
  const [navigationHistory, setNavigationHistory] = React.useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState<number>(-1);

  const currentPath = selectedNode || 'dataset';
  
  // Update history when currentPath changes
  React.useEffect(() => {
    if (currentPath) {
      // If we're not at the end of history, truncate it
      if (historyIndex < navigationHistory.length - 1) {
        setNavigationHistory(prev => prev.slice(0, historyIndex + 1));
      }
      
      // Add new path if it's different from the current one
      if (historyIndex === -1 || currentPath !== navigationHistory[historyIndex]) {
        setNavigationHistory(prev => [...prev, currentPath]);
        setHistoryIndex(prev => prev + 1);
      }
    }
  }, [currentPath, historyIndex, navigationHistory]);
  
  const navigateTo = useCallback((path: string) => {
    setSelectedNode(path);
  }, [setSelectedNode]);
  
  // Add goBack function
  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const previousPath = navigationHistory[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setSelectedNode(previousPath);
    }
  }, [historyIndex, navigationHistory, setSelectedNode]);
  
  // Determine if we can go back
  const canGoBack = historyIndex > 0;
  
  const breadcrumbs = useMemo(() => 
    generateBreadcrumbs(currentPath), [currentPath, dataset]);
  
  return (
    <RouterContext.Provider value={{ currentPath, navigateTo, goBack, breadcrumbs, canGoBack }}>
      {children}
    </RouterContext.Provider>
  );
};

// Hook to use router
export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};

// Router component
export const Router: React.FC = () => {
  const { currentPath } = useRouter();
  const { updateDataset, isLoading, dataset, loadingMessage, datasetName } = useLiPDStore(state => ({
    updateDataset: state.updateDataset,
    isLoading: state.isLoading,
    dataset: state.dataset,
    loadingMessage: state.loadingMessage,
    datasetName: state.datasetName
  }));
  
  // Show loading indicator while dataset is loading
  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%', 
        width: '100%',
        p: 3
      }}>
        <CircularProgress size={40} />
        <Typography sx={{ mt: 2, mb: 1 }} variant="h6">
          {datasetName ? `Loading ${datasetName}...` : 'Loading dataset...'}
        </Typography>
        {loadingMessage && (
          <Typography variant="body2" color="text.secondary">
            {loadingMessage}
          </Typography>
        )}
      </Box>
    );
  }
  
  // If no dataset is available, show a message
  if (!dataset) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%', 
        width: '100%',
        p: 3
      }}>
        <Typography variant="h6">
          No dataset available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please select a dataset to view
        </Typography>
      </Box>
    );
  }
  
  const match = findMatchingRoute(currentPath);
  if (!match) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%', 
        width: '100%',
        p: 3,
        textAlign: 'center'
      }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Path not found: {currentPath}</Typography>
        <Typography>Please select an item from the navigation panel or try reloading the editor.</Typography>
      </Box>
    );
  }

  const { route, params, schema } = match;
  const Component = route.component;
  const title = typeof route.title === 'function' ? route.title(params) : route.title;

  return <Component 
    dataset={dataset}
    params={params} 
    path={currentPath}
    onUpdate={updateDataset}
    schema={schema}
    title={title}
  />;
};