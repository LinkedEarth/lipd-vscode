import { Change, ChangeLog, ChronData, DataTable, Funding, PaleoData, Person, Publication, Variable, Compilation } from "lipdjs";

export const getPublicationAuthorsLabel = (publication: Publication) : string => {
    return publication.authors.map((author) => author.name).join(', ');
};

export const getPublicationTitleLabel = (publication: Publication) : string => {
    return publication.title || '';
};

export const getPublicationFullLabel = (publication: Publication) : string => {
    return `${getPublicationTitleLabel(publication)} (${getPublicationAuthorsLabel(publication)})`;
};

export const getDataTableLabel = (dataTable: DataTable) : string => {
    return dataTable.fileName || '';
};

export const getDataTableVariablesLabel = (dataTable: DataTable) : string => {
    return dataTable.variables.map((variable) => variable.name).join(', ');
};

export const getMeasurementTablesLabel = (data: PaleoData | ChronData) : string => {
    return (data.measurementTables?.length.toString() || '0') + ' measurement tables';
};

export const getModeledByLabel = (data: PaleoData | ChronData) : string => {
    return (data.modeledBy?.length.toString() || '0') + ' models';
};

export const getDataDetailsLabel = (data: PaleoData | ChronData) : string => {
    return `${getMeasurementTablesLabel(data)}, ${getModeledByLabel(data)}`;
};

export const getPersonNameLabel = (person: Person) : string => {
    return person.name || '';
};

export const getVariableNameLabel = (variable: Variable) : string => {
    return variable.name || '';
};

export const getVariableDescriptionLabel = (variable: Variable) : string => {
    return variable.description || '';
};

export const getVariableUnitsLabel = (variable: Variable) : string => {
    return variable.units?.getLabel() || '';
};

export const getFundingLabel = (funding: Funding) : string => {
    return funding.fundingAgency || '';
};

export const getFundingGrantsLabel = (funding: Funding) : string => {
    return (funding.grants || []).join(', ');
};

export const getChangeLogLabel = (changeLog: ChangeLog) : string => {
    return changeLog.timestamp || '';
};

export const getChangeLogCuratorLabel = (changeLog: ChangeLog) : string => {
    return changeLog.curator || '';
};

export const getChangeLogEntryLabel = (changeLogEntry: Change) : string => {
    return changeLogEntry.name || '';
};

export const getCompilationNameLabel = (compilation: Compilation) : string => {
    return compilation.name || '';
};
