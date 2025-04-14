import React, { useContext, useCallback, useMemo } from 'react';
import { useLiPDStore } from './store';
import { DataTableEditor } from './components/DataTableEditor';
import { chronDataSchema, datasetSchema, dataTableSchema, modelSchema, paleoDataSchema, publicationSchema, Schema, variableSchema } from './schemas';
import { DefaultListEditor } from './components/DefaultListEditor';
import { DefaultEditor } from './components/DefaultEditor';

// Define route types
interface Route {
  path: string;
  component: React.ComponentType<any>;
  schema?: Schema;
  label: string | ((params: RouteParams) => string);
  getParams?: (path: string) => RouteParams | null;
  title?: string;
}

interface RouteParams {
  [key: string]: string | number;
}

// Define the router context
interface RouterContextType {
  currentPath: string;
  navigateTo: (path: string) => void;
  breadcrumbs: { label: string; path: string }[];
}

// Editor props interface
export interface EditorProps {
  path: string;
  title?: string;
  params?: {
      index?: number;
      paleoIndex?: number;
      chronIndex?: number;
      publicationIndex?: number;
      tableIndex?: number;
      modelIndex?: number;
      summaryTableIndex?: number;
      ensembleTableIndex?: number;
      distributionTableIndex?: number;
      varIndex?: number;
  };
  onUpdate: (path: string, updatedObject: any) => void;
  schema?: Schema;
  columns?: number;
  dense?: boolean;
}

const RouterContext = React.createContext<RouterContextType | null>(null);

// Define routes
const routes: Route[] = [
  {
    path: 'dataset',
    component: DefaultEditor,
    label: 'Dataset',
    title: 'Dataset',
    schema: datasetSchema
  },
  {
    path: 'dataset/paleoData',
    component: DefaultListEditor,
    label: 'PaleoData',
    title: 'PaleoData',
    getParams: (path) => {
      const match = path.match(/^dataset\.paleoData$/);
      return match ? {} : null;
    },
    schema: paleoDataSchema
  },
  {
    path: 'dataset/paleoData/:index',
    component: DefaultEditor,
    title: 'PaleoData',
    label: params => `PaleoData ${Number(params.paleoIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.paleoData\.(\d+)$/);
      return match ? { 
        paleoIndex: parseInt(match[1]) 
      } : null;
    },
    schema: paleoDataSchema
  },
  {
    path: 'dataset/chronData',
    component: DefaultListEditor,
    title: 'ChronData',
    label: 'ChronData',
    schema: chronDataSchema,
    getParams: (path) => {
      const match = path.match(/^dataset\.chronData$/);
      return match ? {} : null;
    },
  },
  {
    path: 'dataset/chronData/:index',
    component: DefaultEditor,
    title: 'ChronData',
    label: params => `ChronData ${Number(params.chronIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.chronData\.(\d+)$/);
      return match ? { 
        chronIndex: parseInt(match[1]) 
      } : null;
    },
    schema: chronDataSchema
  },
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
  {
    path: 'dataset/publications/:index',
    component: DefaultEditor,
    title: 'Publication',
    label: params => `Publication ${Number(params.publicationIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.publications\.(\d+)$/);
      return match ? { 
        publicationIndex: parseInt(match[1]) 
      } : null;
    },
    schema: publicationSchema
  },
  {
    path: 'dataset/paleoData/:paleoIndex/measurementTables/:tableIndex',
    component: DataTableEditor,
    title: 'Data Table',
    label: params => `Measurement Table ${Number(params.tableIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.paleoData\.(\d+)\.measurementTables\.(\d+)$/);
      return match ? { 
        paleoIndex: parseInt(match[1]), 
        tableIndex: parseInt(match[2]) 
      } : null;
    },
    schema: dataTableSchema
  },
  {
    path: 'dataset/chronData/:chronIndex/measurementTables/:tableIndex',
    component: DataTableEditor,
    title: 'Data Table',
    label: params => `Measurement Table ${Number(params.tableIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.chronData\.(\d+)\.measurementTables\.(\d+)$/);
      return match ? { 
        chronIndex: parseInt(match[1]), 
        tableIndex: parseInt(match[2]) 
      } : null;
    },
    schema: dataTableSchema
  },
  {
    path: 'dataset/paleoData/:paleoIndex/modeledBy/:modelIndex',
    component: DefaultEditor,
    title: 'Model',
    label: params => `Model ${Number(params.modelIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.paleoData\.(\d+)\.modeledBy\.(\d+)$/);
      return match ? { 
        paleoIndex: parseInt(match[1]), 
        modelIndex: parseInt(match[2]) 
      } : null;
    },
    schema: modelSchema
  },
  {
    path: 'dataset/chronData/:chronIndex/modeledBy/:modelIndex',
    component: DefaultEditor,
    title: 'Model',
    label: params => `Model ${Number(params.modelIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.chronData\.(\d+)\.modeledBy\.(\d+)$/);
      return match ? { 
        chronIndex: parseInt(match[1]), 
        modelIndex: parseInt(match[2]) 
      } : null;
    },
    schema: modelSchema
  },
  {
    path: 'dataset/paleoData/:paleoIndex/measurementTables/:tableIndex/variables/:varIndex',
    component: DefaultEditor,
    title: 'Variable',
    label: params => `Variable ${Number(params.varIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.paleoData\.(\d+)\.measurementTables\.(\d+)\.variables\.(\d+)$/);
      return match ? { 
        paleoIndex: parseInt(match[1]), 
        tableIndex: parseInt(match[2]),
        varIndex: parseInt(match[3])
      } : null;
    },
    schema: variableSchema
  },
  {
    path: 'dataset/chronData/:chronIndex/measurementTables/:tableIndex/variables/:varIndex',
    component: DefaultEditor,
    title: 'Variable',
    label: params => `Variable ${Number(params.varIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.chronData\.(\d+)\.measurementTables\.(\d+)\.variables\.(\d+)$/);
      return match ? { 
        chronIndex: parseInt(match[1]), 
        tableIndex: parseInt(match[2]),
        varIndex: parseInt(match[3])
      } : null;
    },
    schema: variableSchema
  },

  // PaleoData modeledBy summary Tables
  {
    path: 'dataset/paleoData/:paleoIndex/modeledBy/:modelIndex/summaryTables/:summaryTableIndex',
    component: DataTableEditor,
    title: 'Data Table',
    label: params => `Summary Table ${Number(params.summaryTableIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.paleoData\.(\d+)\.modeledBy\.(\d+)\.summaryTables\.(\d+)$/);
      return match ? { 
        paleoIndex: parseInt(match[1]), 
        modelIndex: parseInt(match[2]),
        summaryTableIndex: parseInt(match[3]) 
      } : null;
    },
    schema: dataTableSchema
  }, 
  // PaleoData modeledBy summary Tables variables
  {
    path: 'dataset/paleoData/:paleoIndex/modeledBy/:modelIndex/summaryTables/:summaryTableIndex/variables/:varIndex',
    component: DefaultEditor,
    title: 'Variable',
    label: params => `Variable ${Number(params.varIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.chronData\.(\d+)\.modeledBy\.(\d+)\.summaryTables\.(\d+)\.variables\.(\d+)$/);
      return match ? { 
        chronIndex: parseInt(match[1]), 
        modelIndex: parseInt(match[2]),
        summaryTableIndex: parseInt(match[3]),
        varIndex: parseInt(match[4])
      } : null;
    },
    schema: variableSchema
  },
  // ChronData modeledBy summary Tables
  {
    path: 'dataset/chronData/:chronIndex/modeledBy/:modelIndex/summaryTables/:summaryTableIndex',
    component: DataTableEditor,
    title: 'Data Table',
    label: params => `Summary Table ${Number(params.summaryTableIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.chronData\.(\d+)\.modeledBy\.(\d+)\.summaryTables\.(\d+)$/);
      return match ? { 
        chronIndex: parseInt(match[1]), 
        modelIndex: parseInt(match[2]),
        summaryTableIndex: parseInt(match[3]) 
      } : null;
    },
    schema: dataTableSchema
  }, 
  // ChronData modeledBy summary Tables variables
  {
    path: 'dataset/chronData/:chronIndex/modeledBy/:modelIndex/summaryTables/:summaryTableIndex/variables/:varIndex',
    component: DefaultEditor,
    title: 'Variable',
    label: params => `Variable ${Number(params.varIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.chronData\.(\d+)\.modeledBy\.(\d+)\.summaryTables\.(\d+)\.variables\.(\d+)$/);
      return match ? { 
        chronIndex: parseInt(match[1]), 
        modelIndex: parseInt(match[2]),
        summaryTableIndex: parseInt(match[3]),
        varIndex: parseInt(match[4])
      } : null;
    },
    schema: variableSchema
  },
  // PaleoData modeledBy ensemble Tables
  {
    path: 'dataset/paleoData/:paleoIndex/modeledBy/:modelIndex/ensembleTables/:ensembleTableIndex',
    component: DataTableEditor,
    title: 'Data Table',
    label: params => `Ensemble Table ${Number(params.ensembleTableIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.paleoData\.(\d+)\.modeledBy\.(\d+)\.ensembleTables\.(\d+)$/);
      return match ? { 
        paleoIndex: parseInt(match[1]), 
        modelIndex: parseInt(match[2]), 
        ensembleTableIndex: parseInt(match[3]) 
      } : null;
    },
    schema: dataTableSchema
  },    
  // PaleoData modeledBy ensemble Tables variables
  {
    path: 'dataset/paleoData/:paleoIndex/modeledBy/:modelIndex/ensembleTables/:ensembleTableIndex/variables/:varIndex',
    component: DefaultEditor,
    title: 'Variable',
    label: params => `Variable ${Number(params.varIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.paleoData\.(\d+)\.modeledBy\.(\d+)\.ensembleTables\.(\d+)\.variables\.(\d+)$/);
      return match ? { 
        paleoIndex: parseInt(match[1]), 
        modelIndex: parseInt(match[2]),
        ensembleTableIndex: parseInt(match[3]),
        varIndex: parseInt(match[4])
      } : null;
    },
    schema: variableSchema
  },  
  // chronData modeledBy ensemble Tables
  {
    path: 'dataset/chronData/:chronIndex/modeledBy/:modelIndex/ensembleTables/:ensembleTableIndex',
    component: DataTableEditor,
    title: 'Data Table',
    label: params => `Ensemble Table ${Number(params.ensembleTableIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.chronData\.(\d+)\.modeledBy\.(\d+)\.ensembleTables\.(\d+)$/);
      return match ? { 
        chronIndex: parseInt(match[1]), 
        modelIndex: parseInt(match[2]), 
        ensembleTableIndex: parseInt(match[3]) 
      } : null;
    },
    schema: dataTableSchema
  },    
  // chronData modeledBy ensemble Tables variables
  {
    path: 'dataset/chronData/:chronIndex/modeledBy/:modelIndex/ensembleTables/:ensembleTableIndex/variables/:varIndex',
    component: DefaultEditor,
    title: 'Variable',
    label: params => `Variable ${Number(params.varIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.chronData\.(\d+)\.modeledBy\.(\d+)\.ensembleTables\.(\d+)\.variables\.(\d+)$/);
      return match ? { 
        chronIndex: parseInt(match[1]), 
        modelIndex: parseInt(match[2]),
        ensembleTableIndex: parseInt(match[3]),
        varIndex: parseInt(match[4])
      } : null;
    },
    schema: variableSchema
  },   
  // PaleoData modeledBy distribution Tables
  {
    path: 'dataset/paleoData/:paleoIndex/modeledBy/:modelIndex/distributionTables/:distributionTableIndex',
    component: DataTableEditor,
    title: 'Data Table',
    label: params => `Distribution Table ${Number(params.distributionTableIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.paleoData\.(\d+)\.modeledBy\.(\d+)\.distributionTables\.(\d+)$/);
      return match ? { 
        paleoIndex: parseInt(match[1]), 
        modelIndex: parseInt(match[2]), 
        distributionTableIndex: parseInt(match[3]) 
      } : null;
    },
    schema: dataTableSchema
  },  
  // PaleoData modeledBy distribution Tables variables
  {
    path: 'dataset/paleoData/:paleoIndex/modeledBy/:modelIndex/distributionTables/:distributionTableIndex/variables/:varIndex',
    component: DefaultEditor,
    title: 'Variable',
    label: params => `Variable ${Number(params.varIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.paleoData\.(\d+)\.modeledBy\.(\d+)\.distributionTables\.(\d+)\.variables\.(\d+)$/);
      return match ? { 
        paleoIndex: parseInt(match[1]), 
        modelIndex: parseInt(match[2]),
        distributionTableIndex: parseInt(match[3]),
        varIndex: parseInt(match[4])
      } : null;
    },
    schema: variableSchema
  },  
  // chronData modeledBy distribution Tables
  {
    path: 'dataset/chronData/:chronIndex/modeledBy/:modelIndex/distributionTables/:distributionTableIndex',
    component: DataTableEditor,
    title: 'Data Table',
    label: params => `Distribution Table ${Number(params.distributionTableIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.chronData\.(\d+)\.modeledBy\.(\d+)\.distributionTables\.(\d+)$/);
      return match ? { 
        chronIndex: parseInt(match[1]), 
        modelIndex: parseInt(match[2]), 
        distributionTableIndex: parseInt(match[3]) 
      } : null;
    },
    schema: dataTableSchema
  },  
  // chronData modeledBy distribution Tables variables
  {
    path: 'dataset/chronData/:chronIndex/modeledBy/:modelIndex/distributionTables/:distributionTableIndex/variables/:varIndex',
    component: DefaultEditor,
    title: 'Variable',
    label: params => `Variable ${Number(params.varIndex) + 1}`,
    getParams: (path) => {
      const match = path.match(/^dataset\.chronData\.(\d+)\.modeledBy\.(\d+)\.distributionTables\.(\d+)\.variables\.(\d+)$/);
      return match ? { 
        chronIndex: parseInt(match[1]), 
        modelIndex: parseInt(match[2]),
        distributionTableIndex: parseInt(match[3]),
        varIndex: parseInt(match[4])
      } : null;
    },
    schema: variableSchema
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
      const label = typeof route.label === 'function' ? route.label(params) : route.label;
      breadcrumbs.push({ label, path: currentPath });
    }
  }
  
  return breadcrumbs;
};

// Router provider component
export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedNode, setSelectedNode } = useLiPDStore((state) => ({
    selectedNode: state.selectedNode,
    setSelectedNode: state.setSelectedNode,
  }));

  const currentPath = selectedNode || '';
  
  const navigateTo = useCallback((path: string) => {
    setSelectedNode(path);
  }, [setSelectedNode]);
  
  const breadcrumbs = useMemo(() => 
    generateBreadcrumbs(currentPath), [currentPath]);
  
  return (
    <RouterContext.Provider value={{ currentPath, navigateTo, breadcrumbs }}>
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
  const { updateDataset } = useLiPDStore(state => ({updateDataset: state.updateDataset}));
  
  const match = findMatchingRoute(currentPath);
  if (!match) {
    return <div>Page not found</div>;
  }

  const { route, params, schema } = match;
  const Component = route.component;

  return <Component 
    params={params} 
    path={currentPath}
    onUpdate={updateDataset}
    schema={schema}
    title={route.title}
  />;
};

// Breadcrumb component
export const Breadcrumbs: React.FC = () => {
  const { breadcrumbs, navigateTo } = useRouter();

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      padding: '8px 16px',
      background: '#f5f5f5',
      borderRadius: '4px'
    }}>
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.path}>
          {index > 0 && <span style={{ margin: '0 8px' }}>/</span>}
          <span
            style={{ 
              cursor: 'pointer',
              color: index === breadcrumbs.length - 1 ? '#000' : '#0366d6',
              fontWeight: index === breadcrumbs.length - 1 ? 'bold' : 'normal'
            }}
            onClick={() => navigateTo(crumb.path)}
          >
            {crumb.label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}; 