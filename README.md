# LiPD VSCode Extension

This extension provides support for reading and writing LiPD (Linked Paleo Data) files in Visual Studio Code.

## Features

- Open and view LiPD (.lpd) files directly in VS Code
- Interactive editor with form-based editing of all LiPD properties
- Map visualization for location data using Mapbox
- Create new empty LiPD files
- Edit datasets with built-in undo/redo functionality
- Export CSV data from data tables

## Screenshots

### Dataset Overview
![Dataset Overview](images/dataset.png)

### Interactive Map for Location Data
![Location Map](images/location.png)

### Data Table Editing
![Data Table Editor](images/datatable.png)

### Publications
![Publications](images/publications.png)

## Requirements

- Visual Studio Code 1.85.0 or higher

## Installation

You can install the extension directly from the VS Code Marketplace:

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "LiPD File Support"
4. Click Install

## Usage

### Opening LiPD Files:
- Double-click on any `.lpd` file in your workspace to open it in the custom editor
- You can also right-click on a `.lpd` file and select "Open With..." > "LiPD Editor"

### Creating New Files:
- Create a new file with a `.lpd` extension
- An empty dataset will be created automatically

### Editing:
- Navigate through the dataset using the tree view
- Edit fields directly in the form
- Map locations can be set by dragging the marker or entering coordinates
- All changes support Undo (Ctrl+Z) and Redo (Ctrl+Y)

### Saving:
- Save changes with Ctrl+S (Cmd+S on macOS)
- Use File > Save As... to save to a new location

## Extension Settings

This extension doesn't currently require any settings.

## Related projects
- [LiPD-JS](https://github.com/LinkedEarth/lipdjs) : This is a javascript library to read/write LiPD files. This extension uses this library.
- [PyLiPD](https://github.com/LinkedEarth/pylipd) : This is a python library to read/write LiPD files
## Known Issues

- Some complex LiPD structures may not be fully supported yet
- Currently, the extension works best with relatively small to medium-sized LiPD files

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request to the [GitHub repository](https://github.com/LinkedEarth/lipd-vscode).

## License

This extension is licensed under the MIT License - see the LICENSE file for details. 
