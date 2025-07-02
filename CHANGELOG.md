# Change Log

All notable changes to the "LiPD File Support" extension will be documented in this file.

## [1.4.1] - 2025-07-02

### Changed
- Updated dependency `@linkedearth/lipd-ui` to **v0.4.0** for bug fixes and improved UI components performance
- No code changes other than dependency bump

## [1.4.0] - 2024-12-15

### Changed
- **Major UI Refactoring**: Migrated all UI components from local files to external `@linkedearth/lipd-ui` package
- Removed 18 local component files (AppBarActions, AppBarBreadcrumbs, ChronDataTree, ConfirmDialog, etc.)
- Simplified App.tsx to use components from the external package
- Updated build configuration and dependencies to support external UI package
- Reduced codebase size by ~3000 lines through component consolidation

### Improved
- Enhanced code maintainability by centralizing UI components in a shared package
- Better separation of concerns between extension logic and UI components
- Streamlined development workflow for UI updates across LinkedEarth projects

## [1.3.0] - 2024-12-15

### Added
- Support for multiple compilations per variable (partOfCompilations array)
- Compilation name display in lists for better identification
- Full routing and editor support for individual compilation items
- Compilation label functions for consistent UI display

### Changed
- Updated lipdjs dependency from v0.1.4 to v0.2.0
- Changed partOfCompilation (singular) to partOfCompilations (plural array) to support multiple values
- Enhanced Variable schema to handle array of compilations instead of single compilation object

### Fixed
- Compilation items now properly display their names in lists instead of generic labels
- Clicking on compilation items now correctly opens the compilation editor
- Added missing routes for compilation navigation in both measurement and modeled tables

## [1.2.5] - 2024-12-XX

### Maintenance
- Various bug fixes and improvements

## [1.1.0] - 2024-07-XX

### Added
- LiPD Explorer view for browsing remote datasets from a GraphDB SPARQL endpoint
- Ability to connect to and view datasets from a remote GraphDB repository
- Configuration setting for customizing the GraphDB endpoint URL
- Status bar item for quick access to GraphDB connection settings

## [1.0.0] - 2024-07-XX

### Added
- Initial release of LiPD File Support extension
- Support for opening and viewing LiPD files in VS Code
- Custom editor for visualizing and editing LiPD data
- Map visualization for location data
- Undo/redo functionality integrated with VS Code
- Support for creating new LiPD files 