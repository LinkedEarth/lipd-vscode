# @linkedearth/lipd-ui

React component library for LiPD (Linked Paleo Data) datasets, providing a complete UI for viewing and editing LiPD data.

## Features

- 🌐 **Complete LiPD Dataset UI** - Navigate and edit all aspects of LiPD datasets
- 📊 **Data Table Editor** - View and edit measurement data tables
- 🗺️ **Location Editor** - Interactive map-based location editing with Mapbox
- 📝 **Form Components** - Comprehensive form fields for all LiPD metadata
- 🎨 **Material-UI Based** - Modern, accessible UI components
- 🔄 **State Management** - Built-in Zustand store for dataset management
- 📱 **Responsive Design** - Works on desktop and mobile

## Demo

See the library in action with our interactive demo:

```bash
npm run demo
```

This will install dependencies and start the demo at http://localhost:3001.

Alternatively, run manually:

```bash
cd demo
npm install
npm run dev
```

## Installation

```bash
npm install @linkedearth/lipd-ui
```

## Peer Dependencies

Make sure you have these installed in your project:

```bash
npm install react react-dom @mui/material @mui/icons-material @mui/x-data-grid @mui/x-tree-view @emotion/react @emotion/styled lipdjs@0.2.7 mapbox-gl zustand
```

## Quick Start

```tsx
import React from 'react';
import { Dataset } from 'lipdjs';
import {
  useLiPDStore,
  NavigationPanel,
  EditorPanel,
  RouterProvider
} from '@linkedearth/lipd-ui';

function App() {
  const { dataset, setDataset } = useLiPDStore();

  // Load your LiPD dataset
  React.useEffect(() => {
    // Example: Load dataset from your data source
    const myDataset = new Dataset(/* your data */);
    setDataset(myDataset);
  }, []);

  return (
    <RouterProvider>
      <div style={{ display: 'flex', height: '100vh' }}>
        <NavigationPanel dataset={dataset} />
        <EditorPanel />
      </div>
    </RouterProvider>
  );
}

export default App;
```

## Components

### Core Components

- **`RouterProvider`** - Provides navigation context for the entire app
- **`NavigationPanel`** - Tree-based navigation for dataset structure
- **`EditorPanel`** - Main content area that renders appropriate editors
- **`AppBarBreadcrumbs`** - Breadcrumb navigation
- **`AppBarActions`** - Action buttons (save, undo, redo, etc.)

### Editors

- **`DefaultEditor`** - Generic form editor for metadata objects
- **`DataTableEditor`** - Spreadsheet-like editor for measurement data
- **`LocationEditor`** - Interactive map for geographic coordinates
- **`DefaultListEditor`** - Editor for arrays of objects

### Form Components

- **`FormTextField`** - Text input with validation
- **`DefaultEnumEditor`** - Dropdown/select component
- **`ListView`** - List view with add/edit/delete actions

## Store Usage

The library includes a pre-configured Zustand store:

```tsx
import { useLiPDStore } from '@linkedearth/lipd-ui';

function MyComponent() {
  const {
    dataset,
    setDataset,
    selectedNode,
    setSelectedNode,
    updateDataset
  } = useLiPDStore();

  // Update a field in the dataset
  const handleUpdate = (path: string, value: any) => {
    updateDataset(path, value);
  };

  return (
    // Your component JSX
  );
}
```

## Theming

The library uses Material-UI theming. You can customize the theme:

```tsx
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

const theme = createTheme({
  // Your theme customizations
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Your app components */}
    </ThemeProvider>
  );
}
```

## Environment Variables

For the Location Editor (Mapbox integration):

```bash
# Optional: Set your Mapbox token
MAPBOX_TOKEN=your_mapbox_access_token
```

## API Reference

### Store Actions

- `setDataset(dataset)` - Set the current dataset
- `updateDataset(path, value)` - Update a field in the dataset
- `setSelectedNode(path)` - Navigate to a specific node
- `setIsLoading(loading)` - Set loading state

### Router Paths

The library supports these navigation paths:

- `dataset` - Root dataset view
- `dataset.location` - Location editor
- `dataset.paleoData.{index}` - PaleoData object
- `dataset.chronData.{index}` - ChronData object
- `dataset.publications.{index}` - Publication object
- And many more...

## Integration Examples

### With VS Code Extension

```tsx
// Handle messages from VS Code
window.addEventListener('message', (event) => {
  const message = event.data;
  
  switch (message.type) {
    case 'init':
      const dataset = Dataset.fromDictionary(message.data);
      useLiPDStore.getState().setDataset(dataset);
      break;
  }
});
```

### With Web Application

```tsx
import { LiPD } from 'lipdjs';

// Load from remote GraphDB
const lipd = new LiPD();
lipd.setEndpoint('https://your-graphdb-endpoint.com');
await lipd.loadRemoteDatasets('datasetName');
const datasets = await lipd.getDatasets();
useLiPDStore.getState().setDataset(datasets[0]);
```

## Contributing

This library is part of the LiPD VS Code extension project. Contributions welcome!

## License

MIT 