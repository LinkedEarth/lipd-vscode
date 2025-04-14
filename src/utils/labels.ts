import { DataTable, PaleoData, Person, Publication, Variable } from "lipdjs";

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

export const getPaleoDataLabel = (paleoData: PaleoData) : string => {
    return paleoData.name || '';
};

export const getPaleoDataMeasurementTablesLabel = (paleoData: PaleoData) : string => {
    return (paleoData.measurementTables?.length.toString() || '0') + ' measurement tables';
};

export const getPaleoDataModeledByLabel = (paleoData: PaleoData) : string => {
    return (paleoData.modeledBy?.length.toString() || '0') + ' models';
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

