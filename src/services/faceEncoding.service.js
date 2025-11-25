/**
 * Service for generating face encodings using Python face recognition scripts
 */

import { spawn } from 'child_process';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class FaceEncodingService {
    constructor() {
        // Path to the face-recognition folder
        this.faceRecognitionPath = join(__dirname, '../../face-recognition');
        this.tempImagesPath = join(this.faceRecognitionPath, 'dataset', 'temp');
        this.pythonScript = join(this.faceRecognitionPath, 'train_encodings.py');
    }

    /**
     * Generate face encodings for a person
     * @param {string} personType - 'STUDENT' or 'TEACHER'
     * @param {number} personId - Person's ID from database
     * @param {string[]} base64Images - Array of base64 encoded images
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async generateEncodings(personType, personId, base64Images) {
        try {
            // Create temp directory if it doesn't exist
            await this.ensureTempDirectory();

            // Save images to temporary files
            const imagePaths = await this.saveImagesToTemp(personId, personType, base64Images);

            // Call Python script to generate encodings
            const result = await this.callPythonScript(personType, personId, imagePaths);

            // Clean up temporary files
            await this.cleanupTempFiles(imagePaths);

            return result;
        } catch (error) {
            console.error('Error generating face encodings:', error);
            return {
                success: false,
                message: error.message || 'Failed to generate face encodings'
            };
        }
    }

    /**
     * Ensure temp directory exists
     */
    async ensureTempDirectory() {
        if (!existsSync(this.tempImagesPath)) {
            await mkdir(this.tempImagesPath, { recursive: true });
        }
    }

    /**
     * Save base64 images to temporary files
     * @param {number} personId - Person's ID
     * @param {string} personType - 'STUDENT' or 'TEACHER'
     * @param {string[]} base64Images - Array of base64 images
     * @returns {Promise<string[]>} - Array of file paths
     */
    async saveImagesToTemp(personId, personType, base64Images) {
        const imagePaths = [];

        for (let i = 0; i < base64Images.length; i++) {
            const base64Data = base64Images[i].replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');

            const filename = `${personType.toLowerCase()}_${personId}_${i + 1}.jpg`;
            const filepath = join(this.tempImagesPath, filename);

            await writeFile(filepath, buffer);
            imagePaths.push(filepath);
        }

        return imagePaths;
    }

    /**
     * Call Python script to generate encodings
     * @param {string} personType - 'STUDENT' or 'TEACHER'
     * @param {number} personId - Person's ID
     * @param {string[]} imagePaths - Array of image file paths
     * @returns {Promise<{success: boolean, message: string}>}
     */
    callPythonScript(personType, personId, imagePaths) {
        return new Promise((resolve, reject) => {
            // For now, we'll call the train_encodings.py script
            // This assumes the script can handle individual person encoding
            const pythonProcess = spawn('python', [
                this.pythonScript,
                '--person-type', personType,
                '--person-id', personId.toString(),
                '--images', imagePaths.join(',')
            ]);

            let stdout = '';
            let stderr = '';

            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    resolve({
                        success: true,
                        message: 'Face encodings generated successfully'
                    });
                } else {
                    console.error('Python script error:', stderr);
                    resolve({
                        success: false,
                        message: `Face encoding generation failed: ${stderr || 'Unknown error'}`
                    });
                }
            });

            pythonProcess.on('error', (error) => {
                console.error('Failed to start Python process:', error);
                reject(new Error(`Failed to start face encoding process: ${error.message}`));
            });
        });
    }

    /**
     * Clean up temporary image files
     * @param {string[]} imagePaths - Array of file paths to delete
     */
    async cleanupTempFiles(imagePaths) {
        for (const filepath of imagePaths) {
            try {
                await unlink(filepath);
            } catch (error) {
                console.error(`Failed to delete temp file ${filepath}:`, error);
            }
        }
    }
}

export default new FaceEncodingService();
