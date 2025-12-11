// File storage service for the application
// Handles file uploads via API and manages file references

interface StoredFile {
    id: string;
    name: string;
    type: string;
    size: number;
    path: string;
    uploadDate: Date;
    apiResponse: any; // Response from upload API
}

class FileStorageService {
    public files: Map<string, StoredFile> = new Map();
    private fileIdCounter = 0;

    // Generate unique file ID
    private generateFileId(): string {
        return `file_${Date.now()}_${++this.fileIdCounter}`;
    }

    // Upload file via API and return file info
    async uploadFile(file: File, lessonId: string, type: string, title: string, metadata?: any): Promise<StoredFile> {
        const fileId = this.generateFileId();

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('lessonId', lessonId);
        formData.append('type', type);
        formData.append('title', title);
        if (metadata) {
            formData.append('metadata', JSON.stringify(metadata));
        }

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                let errorMessage = response.statusText;
                try {
                    const errorData = await response.json();
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (e) {
                    // Ignore if response is not JSON
                }
                throw new Error(`Upload failed: ${errorMessage}`);
            }

            const result = await response.json();

            const storedFile: StoredFile = {
                id: fileId,
                name: file.name,
                type: file.type,
                size: file.size,
                path: result.fileInfo.path,
                uploadDate: new Date(),
                apiResponse: result
            };

            this.files.set(fileId, storedFile);
            return storedFile;
        } catch (error) {
            console.error('File upload error:', error);
            throw error;
        }
    }

    // Get file by ID
    getFile(fileId: string): StoredFile | undefined {
        return this.files.get(fileId);
    }

    // Get file URL for viewing/downloading
    getFileUrl(fileId: string): string | null {
        const file = this.files.get(fileId);
        if (!file) return null;

        // Extract filename from path and create API URL
        const filename = file.apiResponse?.fileInfo?.filename;
        if (filename) {
            return `/api/files/${filename}`;
        }
        return null;
    }

    // Get file download URL
    getDownloadUrl(fileId: string): string | null {
        return this.getFileUrl(fileId);
    }

    // Delete file from API
    async deleteFile(fileId: string): Promise<boolean> {
        const file = this.files.get(fileId);
        if (file) {
            try {
                const response = await fetch(`/api/content/${fileId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    this.files.delete(fileId);
                    return true;
                } else {
                    console.error('Failed to delete file via API');
                    return false;
                }
            } catch (error) {
                console.error('File deletion error:', error);
                return false;
            }
        }
        return false;
    }

    // List all files
    getAllFiles(): StoredFile[] {
        return Array.from(this.files.values());
    }

    // Get files by path pattern
    getFilesByPath(pathPattern: string): StoredFile[] {
        return Array.from(this.files.values()).filter(file =>
            file.path.includes(pathPattern)
        );
    }

    // Cached folder mapping for faster lookups
    private static readonly folderMap: { [key: string]: string } = {
        'worksheet': 'Worksheets',
        'book': 'Books',
        'video': 'Videos',
        'audio': 'Audios',
        'questionPaper': 'QuestionPapers',
        'notes': 'Notes',
        'flashcard': 'Flashcards',
        'qa': 'QAPapers',
        'activity': 'Activities',
        'quiz': 'Quizzes'
    };

    // Optimized fast string cleaning - avoid regex for better performance
    private static fastClean(str: string): string {
        if (!str) return '';
        let result = '';
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            if ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || 
                (char >= '0' && char <= '9') || char === ' ' || char === '/' || 
                char === '.' || char === '-') {
                result += char;
            }
        }
        return result;
    }

    // Generate organized file paths for different content types - optimized
    static generateFilePath(resourceType: string, hierarchyPath: string, fileName: string): string {
        const folder = this.folderMap[resourceType] || 'Files';
        
        // Fast string operations without regex
        const cleanHierarchy = this.fastClean(hierarchyPath);
        const cleanFileName = this.fastClean(fileName);

        return `${cleanHierarchy}/${folder}/${cleanFileName}`;
    }

    // Get storage statistics
    getStorageStats() {
        const files = Array.from(this.files.values());
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        const byType: { [key: string]: { count: number; size: number } } = {};

        files.forEach(file => {
            const type = file.type;
            if (!byType[type]) {
                byType[type] = { count: 0, size: 0 };
            }
            byType[type].count++;
            byType[type].size += file.size;
        });

        return {
            totalFiles: files.length,
            totalSize,
            byType
        };
    }
}

// Export singleton instance
export const fileStorage = new FileStorageService();

// Utility functions for common file operations
export const createFilePath = FileStorageService.generateFilePath;

export const FileUploadHelper = {
    // Upload and save file with proper path
    async uploadFile(file: File, lessonId: string, type: string, title: string, metadata?: any): Promise<{ fileId: string; path: string; apiResponse: any }> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('lessonId', lessonId);
        formData.append('type', type);
        formData.append('title', title);
        if (metadata) {
            formData.append('metadata', JSON.stringify(metadata));
        }

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            let errorMessage = response.statusText;
            try {
                const errorData = await response.json();
                if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (e) {
                // Ignore if response is not JSON
            }
            throw new Error(`Upload failed: ${errorMessage}`);
        }

        const result = await response.json();
        const contentId = result.content?._id;

        if (!contentId) {
            throw new Error('Upload response missing content ID');
        }

        // Store file info in local storage for tracking
        const fileId = `content_${contentId}`;
        const storedFile = {
            id: fileId,
            name: file.name,
            type: file.type,
            size: file.size,
            path: result.fileInfo?.path || '',
            uploadDate: new Date(),
            apiResponse: result
        };

        fileStorage.files.set(fileId, storedFile);

        return {
            fileId: fileId,
            path: storedFile.path,
            apiResponse: result
        };
    },

    // Get file URL for rendering - ENHANCED with better error handling and logging
    getFileUrl(fileId: string): string | null {
        try {
            console.log('🔍 Getting file URL for:', fileId);
            
            // Handle content ID format (content_xxx) - NEW format
            if (fileId.startsWith('content_')) {
                const contentId = fileId.replace('content_', '');
                const url = `/api/content/${contentId}/file`;
                console.log('✅ Content ID format URL:', url);
                return url;
            }

            // Handle database-stored fileId format - Check if it looks like a content ID
            if (fileId.match(/^[0-9a-fA-F]{24}$/)) {
                // This looks like a MongoDB ObjectId, treat it as a content ID
                const url = `/api/content/${fileId}/file`;
                console.log('✅ MongoDB ObjectId format URL:', url);
                return url;
            }

            // Handle legacy local storage format
            const file = fileStorage.getFile(fileId);
            if (!file) {
                console.warn('⚠️ File not found in storage:', fileId);
                return null;
            }

            // Try to get filename from API response
            const filename = file.apiResponse?.fileInfo?.filename;
            if (filename) {
                const url = `/api/files/${filename}`;
                console.log('✅ Legacy format URL:', url);
                return url;
            }
            
            console.warn('⚠️ No filename found for file:', fileId);
            return null;
            
        } catch (error) {
            console.error('❌ Error getting file URL:', error);
            return null;
        }
    },

    // Get file download URL
    getDownloadUrl(fileId: string): string | null {
        return this.getFileUrl(fileId);
    },

    // Delete file - with backward compatibility
    async deleteFile(fileId: string): Promise<boolean> {
        try {
            // Handle content ID format (content_xxx)
            if (fileId.startsWith('content_')) {
                const contentId = fileId.replace('content_', '');
                const response = await fetch(`/api/content/${contentId}`, {
                    method: 'DELETE'
                });
                return response.ok;
            }

            // Handle database-stored fileId format - Check if it looks like a content ID
            if (fileId.match(/^[0-9a-fA-F]{24}$/)) {
                // This looks like a MongoDB ObjectId, treat it as a content ID
                const response = await fetch(`/api/content/${fileId}`, {
                    method: 'DELETE'
                });
                return response.ok;
            }

            // Handle legacy local storage format
            return await fileStorage.deleteFile(fileId);
        } catch (error) {
            console.error('File deletion error:', error);
            return false;
        }
    },

    // Check if file exists
    fileExists(fileId: string): boolean {
        if (fileId.startsWith('content_')) {
            return true; // Assume exists if it has content ID format
        }
        return fileStorage.getFile(fileId) !== undefined;
    },

    // Get file info by content ID (for debugging)
    getFileInfoByContentId(contentId: string) {
        const fileId = `content_${contentId}`;
        return fileStorage.getFile(fileId);
    }
};