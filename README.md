# LiPD VSCode Extension

This extension provides support for reading and writing LiPD (Linked Paleo Data) files in Visual Studio Code.

## Features

- Open and read LiPD (.lpd) files
- Convert LiPD files to JSON for viewing and editing
- Save JSON data back to LiPD format
- Basic syntax highlighting for LiPD files

## Requirements

- Visual Studio Code 1.85.0 or higher
- Python 3.6 or higher
- PyLiPD library installed in your Python environment

## Installation

1. Clone this repository
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Install Node.js dependencies:
   ```bash
   npm install
   ```
4. Build the extension:
   ```bash
   npm run compile
   ```
5. Press F5 in VSCode to start debugging the extension

## Usage

1. Open a LiPD file (.lpd extension)
2. Right-click in the editor to see available commands:
   - "Open LiPD File": Opens the LiPD file and shows its contents as JSON
   - "Save as LiPD File": Saves the current JSON content as a LiPD file

## Extension Settings

This extension contributes the following settings:

* `lipd-vscode.enableAutoConvert`: Enable/disable automatic conversion of LiPD files to JSON when opened

## Known Issues

- Binary LiPD files are converted to JSON for viewing
- Some complex LiPD structures may not be fully supported
- Requires Python 3.6 or higher to be installed and accessible from the command line

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This extension is licensed under the MIT License - see the LICENSE file for details. 