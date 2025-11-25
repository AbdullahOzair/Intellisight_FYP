/**
 * Service for handling file uploads (Face Pictures)
 * 
 * Current implementation: base64 → Buffer → PostgreSQL BYTEA
 * Production recommendation: Use S3/Cloudinary and store URLs
 */

export class UploadService {
  /**
   * Convert base64 image to Buffer for PostgreSQL BYTEA storage
   * @param {string} base64String - Base64 encoded image (with data:image prefix)
   * @returns {Buffer} - Buffer to store in database
   */
  base64ToBuffer(base64String) {
    if (!base64String) {
      return null;
    }

    // Extract base64 data (remove data:image/...;base64, prefix)
    const matches = base64String.match(/^data:image\/\w+;base64,(.+)$/);

    if (!matches || matches.length !== 2) {
      throw new Error('Invalid base64 image format');
    }

    const base64Data = matches[1];
    return Buffer.from(base64Data, 'base64');
  }

  /**
   * Convert Buffer to base64 string for API responses
   * @param {Buffer} buffer - Buffer from database
   * @param {string} mimeType - Image MIME type (default: image/png)
   * @returns {string} - Base64 encoded string with data URI prefix
   */
  bufferToBase64(buffer, mimeType = 'image/png') {
    if (!buffer) {
      return null;
    }

    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Validate image size
   * @param {string} base64String - Base64 encoded image
   * @param {number} maxSizeBytes - Maximum size in bytes (default: 5MB)
   */
  validateImageSize(base64String, maxSizeBytes = 5 * 1024 * 1024) {
    const buffer = this.base64ToBuffer(base64String);

    if (buffer && buffer.length > maxSizeBytes) {
      throw new Error(`Image size exceeds maximum allowed (${maxSizeBytes / 1024 / 1024}MB)`);
    }

    return true;
  }

  /**
   * Get file extension from base64 string
   * @param {string} base64String - Base64 encoded image
   * @returns {string} - File extension (png, jpg, etc.)
   */
  getFileExtension(base64String) {
    const matches = base64String.match(/^data:image\/(\w+);base64,/);
    return matches ? matches[1] : 'png';
  }

  /**
   * Convert array of base64 images to JSON string for PostgreSQL storage
   * @param {string[]} base64Array - Array of base64 encoded images
   * @returns {string} - JSON string to store in database
   */
  multipleBase64ToJSON(base64Array) {
    if (!base64Array || !Array.isArray(base64Array) || base64Array.length === 0) {
      return null;
    }

    // Validate each image
    base64Array.forEach((image, index) => {
      this.validateImageSize(image);
    });

    // Store as JSON string (PostgreSQL can store JSON in TEXT fields)
    return JSON.stringify(base64Array);
  }

  /**
   * Convert JSON string to array of base64 images for API responses
   * @param {string} jsonString - JSON string from database
   * @returns {string[]} - Array of base64 encoded images
   */
  jsonToMultipleBase64(jsonString) {
    if (!jsonString) {
      return [];
    }

    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error parsing face pictures JSON:', error);
      return [];
    }
  }
}

export default new UploadService();
