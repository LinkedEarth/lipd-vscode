import React from 'react';
import { Box, Breadcrumbs as MuiBreadcrumbs, Typography } from '@mui/material';
import { NavigateNext, Home } from '@mui/icons-material';
import { Dataset } from 'lipdjs';
import { useLiPDStore } from '../store';

interface BreadcrumbsProps {
    dataset: Dataset;
    activeNode: string | null;
}

const NavigationBreadcrumbs: React.FC<BreadcrumbsProps> = ({ dataset, activeNode }) => {
    const setSelectedNode = useLiPDStore(state => state.setSelectedNode);

    if (!activeNode) return null;

    const parts = activeNode.split('.');
    const breadcrumbs = [];

    // Always start with home
    breadcrumbs.push({
        label: 'Dataset',
        onClick: () => setSelectedNode('dataset')
    });

    if (parts[0] === 'paleoData') {
        breadcrumbs.push({
            label: 'PaleoData',
            onClick: () => setSelectedNode('paleoData')
        });

        if (parts.length >= 2) {
            const paleoIndex = parseInt(parts[1]);
            const paleoData = dataset.getPaleoData()?.[paleoIndex];
            breadcrumbs.push({
                label: paleoData?.getName() || `PaleoData ${paleoIndex + 1}`,
                onClick: () => setSelectedNode(`paleoData.${paleoIndex}`)
            });

            if (parts.length >= 4 && parts[2] === 'measurementTables') {
                const tableIndex = parseInt(parts[3]);
                const table = paleoData?.getMeasurementTables()?.[tableIndex];
                breadcrumbs.push({
                    label: table?.getFileName() || `Table ${tableIndex + 1}`,
                    onClick: () => setSelectedNode(`paleoData.${paleoIndex}.measurementTables.${tableIndex}`)
                });

                // Add variable breadcrumb if we're viewing a variable
                if (parts.length >= 6 && parts[4] === 'variables') {
                    const variableIndex = parseInt(parts[5]);
                    const variable = table?.getVariables()?.[variableIndex];
                    breadcrumbs.push({
                        label: variable?.getName() || `Variable ${variableIndex + 1}`,
                        onClick: () => setSelectedNode(`paleoData.${paleoIndex}.measurementTables.${tableIndex}.variables.${variableIndex}`)
                    });
                }
            } else if (parts.length >= 4 && parts[2] === 'modeledBy') {
                const modelIndex = parseInt(parts[3]);
                breadcrumbs.push({
                    label: `Model ${modelIndex + 1}`,
                    onClick: () => setSelectedNode(`paleoData.${paleoIndex}.modeledBy.${modelIndex}`)
                });

                // Add table breadcrumbs if we're viewing a table
                if (parts.length >= 6) {
                    const tableType = parts[4];
                    const tableIndex = parseInt(parts[5]);
                    const model = paleoData?.getModeledBy()?.[modelIndex];
                    let table;
                    
                    if (tableType === 'ensembleTables') {
                        table = model?.getEnsembleTables()?.[tableIndex];
                        breadcrumbs.push({
                            label: table?.getFileName() || `Ensemble Table ${tableIndex + 1}`,
                            onClick: () => setSelectedNode(`paleoData.${paleoIndex}.modeledBy.${modelIndex}.ensembleTables.${tableIndex}`)
                        });
                    } else if (tableType === 'summaryTables') {
                        table = model?.getSummaryTables()?.[tableIndex];
                        breadcrumbs.push({
                            label: table?.getFileName() || `Summary Table ${tableIndex + 1}`,
                            onClick: () => setSelectedNode(`paleoData.${paleoIndex}.modeledBy.${modelIndex}.summaryTables.${tableIndex}`)
                        });
                    } else if (tableType === 'distributionTables') {
                        table = model?.getDistributionTables()?.[tableIndex];
                        breadcrumbs.push({
                            label: table?.getFileName() || `Distribution Table ${tableIndex + 1}`,
                            onClick: () => setSelectedNode(`paleoData.${paleoIndex}.modeledBy.${modelIndex}.distributionTables.${tableIndex}`)
                        });
                    }

                    // Add variable breadcrumb if we're viewing a variable
                    if (parts.length >= 8 && parts[6] === 'variables') {
                        const variableIndex = parseInt(parts[7]);
                        const variable = table?.getVariables()?.[variableIndex];
                        breadcrumbs.push({
                            label: variable?.getName() || `Variable ${variableIndex + 1}`,
                            onClick: () => setSelectedNode(`${parts.slice(0, 6).join('.')}.variables.${variableIndex}`)
                        });
                    }
                }
            }
        }
    } else if (parts[0] === 'chronData') {
        breadcrumbs.push({
            label: 'ChronData',
            onClick: () => setSelectedNode('chronData')
        });

        if (parts.length >= 2) {
            const chronIndex = parseInt(parts[1]);
            const chronData = dataset.getChronData()?.[chronIndex];
            breadcrumbs.push({
                label: `ChronData ${chronIndex + 1}`,
                onClick: () => setSelectedNode(`chronData.${chronIndex}`)
            });

            if (parts.length >= 4 && parts[2] === 'measurementTables') {
                const tableIndex = parseInt(parts[3]);
                const table = chronData?.getMeasurementTables()?.[tableIndex];
                breadcrumbs.push({
                    label: table?.getFileName() || `Table ${tableIndex + 1}`,
                    onClick: () => setSelectedNode(`chronData.${chronIndex}.measurementTables.${tableIndex}`)
                });

                // Add variable breadcrumb if we're viewing a variable
                if (parts.length >= 6 && parts[4] === 'variables') {
                    const variableIndex = parseInt(parts[5]);
                    const variable = table?.getVariables()?.[variableIndex];
                    breadcrumbs.push({
                        label: variable?.getName() || `Variable ${variableIndex + 1}`,
                        onClick: () => setSelectedNode(`chronData.${chronIndex}.measurementTables.${tableIndex}.variables.${variableIndex}`)
                    });
                }
            } else if (parts.length >= 4 && parts[2] === 'modeledBy') {
                const modelIndex = parseInt(parts[3]);
                breadcrumbs.push({
                    label: `Model ${modelIndex + 1}`,
                    onClick: () => setSelectedNode(`chronData.${chronIndex}.modeledBy.${modelIndex}`)
                });

                // Add table breadcrumbs if we're viewing a table
                if (parts.length >= 6) {
                    const tableType = parts[4];
                    const tableIndex = parseInt(parts[5]);
                    const model = chronData?.getModeledBy()?.[modelIndex];
                    let table;
                    
                    if (tableType === 'ensembleTables') {
                        table = model?.getEnsembleTables()?.[tableIndex];
                        breadcrumbs.push({
                            label: table?.getFileName() || `Ensemble Table ${tableIndex + 1}`,
                            onClick: () => setSelectedNode(`chronData.${chronIndex}.modeledBy.${modelIndex}.ensembleTables.${tableIndex}`)
                        });
                    } else if (tableType === 'summaryTables') {
                        table = model?.getSummaryTables()?.[tableIndex];
                        breadcrumbs.push({
                            label: table?.getFileName() || `Summary Table ${tableIndex + 1}`,
                            onClick: () => setSelectedNode(`chronData.${chronIndex}.modeledBy.${modelIndex}.summaryTables.${tableIndex}`)
                        });
                    } else if (tableType === 'distributionTables') {
                        table = model?.getDistributionTables()?.[tableIndex];
                        breadcrumbs.push({
                            label: table?.getFileName() || `Distribution Table ${tableIndex + 1}`,
                            onClick: () => setSelectedNode(`chronData.${chronIndex}.modeledBy.${modelIndex}.distributionTables.${tableIndex}`)
                        });
                    }

                    // Add variable breadcrumb if we're viewing a variable
                    if (parts.length >= 8 && parts[6] === 'variables') {
                        const variableIndex = parseInt(parts[7]);
                        const variable = table?.getVariables()?.[variableIndex];
                        breadcrumbs.push({
                            label: variable?.getName() || `Variable ${variableIndex + 1}`,
                            onClick: () => setSelectedNode(`${parts.slice(0, 6).join('.')}.variables.${variableIndex}`)
                        });
                    }
                }
            }
        }
    } else if (parts[0] === 'publications') {
        breadcrumbs.push({
            label: 'Publications',
            onClick: () => setSelectedNode('publications')
        });

        if (parts.length >= 2) {
            const pubIndex = parseInt(parts[1]);
            const publication = dataset.getPublications()?.[pubIndex];
            breadcrumbs.push({
                label: publication?.getTitle() || `Publication ${pubIndex + 1}`,
                onClick: () => setSelectedNode(`publications.${pubIndex}`)
            });
        }
    }

    return (
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <MuiBreadcrumbs
                separator={<NavigateNext fontSize="small" />}
                aria-label="breadcrumb"
            >
                {breadcrumbs.map((crumb, index) => (
                    <Typography
                        key={index}
                        color={index === breadcrumbs.length - 1 ? 'text.primary' : 'inherit'}
                        onClick={crumb.onClick}
                        sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        {index === 0 && <Home sx={{ mr: 0.5 }} fontSize="inherit" />}
                        {crumb.label}
                    </Typography>
                ))}
            </MuiBreadcrumbs>
        </Box>
    );
};

export default NavigationBreadcrumbs; 