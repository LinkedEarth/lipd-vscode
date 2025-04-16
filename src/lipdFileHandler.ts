import { LiPD } from 'lipdjs';
import { Dataset } from 'lipdjs';
import { Logger } from './utils/logger'
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

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
            
            // Check if the file exists
            if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
                logger.info(`File doesn't exist or is empty: ${filePath}, creating new Dataset`);
                return this.createNewDataset(filePath);
            }
            
            const lipd = new LiPD();
            await lipd.load(filePath);
            const datasets = await lipd.getDatasets();
            logger.info(`Found ${datasets.length} datasets in LiPD file`);
            
            // Check if datasets array exists and has at least one element
            if (!datasets || datasets.length === 0) {
                logger.info('No datasets found in LiPD file, creating new Dataset');
                return this.createNewDataset(filePath);
            }
            
            return datasets[0];
        } catch (error: unknown) {
            logger.error('ERROR: Failed to read LiPD file', error);
            
            // If file read error, create a new Dataset
            if (error instanceof Error && 
                (error.message.includes('no such file') || 
                 error.message.includes('ENOENT') || 
                 error.message.includes('Failed to parse'))) {
                logger.info('Creating new Dataset due to file read error');
                return this.createNewDataset(filePath);
            }
            
            if (error instanceof Error) {
                throw new Error(`Failed to read LiPD file: ${error.message}`);
            }
            throw new Error('Failed to read LiPD file: Unknown error');
        }
    }

    public async writeLiPDFile(filePath: string, dataset: Dataset): Promise<void> {
        try {
            // Log system information
            logger.info(`OS type: ${os.type()}`);
            logger.info(`OS platform: ${os.platform()}`);
            logger.info(`OS temp dir: ${os.tmpdir()}`);
            logger.info(`Current working directory: ${process.cwd()}`);
            
            // Check write permissions on the target directory
            const targetDir = path.dirname(filePath);
            try {
                // Test if we can write to the target directory
                const testPath = path.join(targetDir, `.lipd-test-${Date.now()}`);
                fs.writeFileSync(testPath, 'test');
                fs.unlinkSync(testPath);
                logger.info(`Target directory ${targetDir} is writable`);
            } catch (e) {
                logger.error(`Target directory ${targetDir} is not writable:`, e);
                throw new Error(`Cannot write to target directory: ${e instanceof Error ? e.message : String(e)}`);
            }
            
            // Set the temporary directory to the OS temp directory using environment variables
            process.env.TEMP_DIR = os.tmpdir();
            process.env.TMPDIR = os.tmpdir();
            process.env.TMP = os.tmpdir();
            
            logger.info(`Environment variables set: TEMP_DIR=${process.env.TEMP_DIR}, TMPDIR=${process.env.TMPDIR}, TMP=${process.env.TMP}`);
            
            try {
                // Primary approach: Try using a custom temp directory
                await this.saveWithCustomTempDir(filePath, dataset);
            } catch (error) {
                logger.error('Primary save method failed, trying alternative approach:', error);
                // Fallback approach: Use direct JSON export
                await this.saveWithJsonFallback(filePath, dataset);
            }
        } catch (error: unknown) {
            logger.error('ERROR: Failed to write LiPD file:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to write LiPD file: ${error.message}`);
            }
            throw new Error('Failed to write LiPD file: Unknown error');
        }
    }
    
    private async saveWithCustomTempDir(filePath: string, dataset: Dataset): Promise<void> {
        // Create a custom temporary directory that we can ensure is writable
        const customTempDir = path.join(os.tmpdir(), `lipd_temp_${Date.now()}`);
        try {
            fs.mkdirSync(customTempDir, { recursive: true });
            logger.info(`Created custom temp directory: ${customTempDir}`);
            
            // Store the original working directory
            const originalDir = process.cwd();
            
            try {
                // Set the current working directory to our custom temp dir
                process.chdir(customTempDir);
                logger.info(`Set working directory to: ${process.cwd()}`);
                
                const lipd = new LiPD();
                logger.info("Loading dataset");
                lipd.loadDatasets([dataset]);
                
                const dsnames = await lipd.getAllDatasetNames();
                logger.info(`Dataset names: ${dsnames.join(', ')}`);
                
                if (dsnames.length > 0) {
                    logger.info(`Creating LiPD file: ${dsnames[0]} with temp dir: ${os.tmpdir()}`);
                    await lipd.createLipd(dsnames[0], filePath);
                    logger.info(`LiPD file saved successfully: ${filePath}`);
                } else {
                    throw new Error('No dataset names found');
                }
            } finally {
                // Restore original working directory
                process.chdir(originalDir);
                logger.info(`Restored working directory to: ${originalDir}`);
                
                // Clean up temp directory
                try {
                    fs.rmdirSync(customTempDir, { recursive: true });
                    logger.info(`Removed custom temp directory: ${customTempDir}`);
                } catch (e) {
                    logger.error(`Failed to clean up temp directory:`, e);
                }
            }
        } catch (error) {
            throw error;
        }
    }
    
    private async saveWithJsonFallback(filePath: string, dataset: Dataset): Promise<void> {
        logger.info("Using JSON fallback method to save LiPD file");
        
        // Use a direct approach without temp files to avoid file system issues
        try {
            // Create a new LiPD instance
            const lipd = new LiPD();
            
            // Use the loadDatasets method which we know exists
            logger.info("Loading dataset directly");
            lipd.loadDatasets([dataset]);
            
            // Get dataset names
            const dsnames = await lipd.getAllDatasetNames();
            
            if (dsnames.length > 0) {
                // Save the LiPD file
                logger.info(`Creating LiPD file directly: ${dsnames[0]}`);
                
                // Make sure we're using a writable directory for any temp operations
                process.env.TEMP_DIR = os.tmpdir();
                process.env.TMPDIR = os.tmpdir();
                process.env.TMP = os.tmpdir();
                
                // Try to create the LiPD file
                // Pass the absolute path to avoid working directory issues
                const absolutePath = path.resolve(filePath);
                await lipd.createLipd(dsnames[0], absolutePath);
                logger.info(`LiPD file saved successfully via direct method: ${absolutePath}`);
            } else {
                throw new Error('No dataset names found in JSON data');
            }
        } catch (error) {
            logger.error('Direct save method failed:', error);
            throw error;
        }
    }

    // Helper to create a new Dataset with a default name based on the file path
    private createNewDataset(filePath: string): Dataset {
        const dataset = new Dataset();
        
        // Extract the filename without extension to use as the dataset name
        const fileName = path.basename(filePath, path.extname(filePath));
        
        // Set dataset name if we have a valid filename
        if (fileName) {
            dataset.setName(fileName);
        } else {
            dataset.setName('New LiPD Dataset');
        }
        
        return dataset;
    }
} 