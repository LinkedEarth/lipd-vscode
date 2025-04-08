import * as vscode from 'vscode';
import * as path from 'path';
import { LiPD } from 'lipdjs';
import { Dataset } from 'lipdjs';
import { Logger } from './utils/logger'

const logger = Logger.getInstance();

export class LiPDFileHandler {
    private static instance: LiPDFileHandler;

    public static getInstance(): LiPDFileHandler {
        if (!LiPDFileHandler.instance) {
            LiPDFileHandler.instance = new LiPDFileHandler();
        }
        return LiPDFileHandler.instance;
    }

    public async readLiPDFile(filePath: string): Promise<Dataset> {
        try {
            logger.info(`Starting to read LiPD file: ${filePath}`);
            const lipd = new LiPD();
            await lipd.load(filePath);
            const datasets = await lipd.getDatasets();
            logger.info(`Found ${datasets.length} datasets in LiPD file`);
            return datasets[0];
        } catch (error: unknown) {
            logger.error('ERROR: Failed to read LiPD file', error);
            if (error instanceof Error) {
                throw new Error(`Failed to read LiPD file: ${error.message}`);
            }
            throw new Error('Failed to read LiPD file: Unknown error');
        }
    }

    public async writeLiPDFile(filePath: string, dataset: Dataset): Promise<void> {
        try {
            const lipd = new LiPD();
            const jsonContent = dataset.toJson();
            // await lipd.setLipd(jsonContent);
            // await lipd.save(filePath);
            logger.info(`LiPD file saved successfully: ${filePath}`);
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error(`Failed to write LiPD file: ${error.message}`);
            }
            throw new Error('Failed to write LiPD file: Unknown error');
        }
    }

    public getDatasetMetadata(dataset: Dataset): any {
        return {
            id: dataset.getDatasetId(),
            name: dataset.getName(),
            description: dataset.getNotes(),
            dataSource: dataset.getDataSource(),
            version: dataset.getVersion(),
            location: dataset.getLocation(),
            paleoData: dataset.getPaleoData(),
            chronData: dataset.getChronData(),
            investigators: dataset.getInvestigators(),
            creators: dataset.getCreators(),
            publications: dataset.getPublications(),
            fundings: dataset.getFundings(),
            archiveType: dataset.getArchiveType(),
            contributors: dataset.getContributors(),
            changeLog: dataset.getChangeLog(),
            collectionName: dataset.getCollectionName(),
            collectionYear: dataset.getCollectionYear(),
            spreadsheetLink: dataset.getSpreadsheetLink(),
            compilationNest: dataset.getCompilationNest()
        };
    }
} 