import React, { useState, useEffect } from 'react';
import { Content, User } from '../../types';
import { useApi } from '../../hooks/useApi';
import * as api from '../../services/api';
import { BookIcon } from '../icons/ResourceTypeIcons';
import { TrashIcon, UploadCloudIcon, ExpandIcon, XIcon, SaveIcon } from '../icons/AdminIcons';
import { ConfirmModal } from '../ConfirmModal';
import { PdfViewer } from './PdfViewer';
import { useToast } from '../../context/ToastContext';

interface BookViewProps {
    lessonId: string;
    user: User;
}

// Enhanced utility to convert Base64 to Blob URL for faster PDF rendering
const useBase64ToBlobUrl = (base64String: string | undefined) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isConverting, setIsConverting] = useState(false);

    useEffect(() => {
        if (!base64String || !base64String.startsWith('data:application/pdf')) {
            setBlobUrl(null);
            setError(null);
            setIsConverting(false);
            return;
        }

        let url: string | null = null;
        setIsConverting(true);
        
        const timer = setTimeout(() => {
            try {
                console.log('🔄 Converting base64 PDF to blob URL...');
                
                const parts = base64String.split(',');
                if (parts.length < 2) {
                    throw new Error('Invalid base64 format - missing comma separator');
                }
                
                const base64 = parts[1];
                if (!base64 || base64.trim() === '') {
                    throw new Error('Empty base64 data');
                }
                
                // Validate base64 format
                const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
                if (!base64Regex.test(base64)) {
                    throw new Error('Invalid base64 encoding format');
                }
                
                console.log('📊 Base64 data validation passed, size:', base64.length);
                
                const binaryStr = atob(base64);
                const len = binaryStr.length;
                const bytes = new Uint8Array(len);
                
                // Validate and convert binary data
                for (let i = 0; i < len; i++) {
                    const charCode = binaryStr.charCodeAt(i);
                    if (charCode > 255) {
                        throw new Error('Invalid base64 encoding - character out of range');
                    }
                    bytes[i] = charCode;
                }
                
                console.log('📦 Binary data converted, bytes:', bytes.length);
                
                const blob = new Blob([bytes], { type: 'application/pdf' });
                if (blob.size === 0) {
                    throw new Error('Generated PDF blob is empty');
                }
                
                if (blob.size > 50 * 1024 * 1024) { // 50MB limit
                    throw new Error('PDF file too large (max 50MB)');
                }
                
                url = URL.createObjectURL(blob);
                setBlobUrl(url);
                setError(null);
                setIsConverting(false);
                console.log('✅ Successfully converted base64 to blob URL:', {
                    blobSize: blob.size,
                    blobUrl: url.substring(0, 50) + '...'
                });
                
            } catch (e: any) {
                console.error("❌ Failed to convert base64 to blob:", e);
                setError(`Failed to process PDF: ${e.message}`);
                setBlobUrl(null);
                setIsConverting(false);
            }
        }, 10); // Small delay to prevent blocking

        return () => {
            clearTimeout(timer);
            if (url) {
                URL.revokeObjectURL(url);
                console.log('🗑️ Cleaned up blob URL');
            }
        };
    }, [base64String]);

    return { blobUrl, error, isConverting };
};

const SavedBookViewer: React.FC<{ content: Content; onRemove: () => void; isAdmin: boolean; onExpand: (url: string) => void; }> = ({ content, onRemove, isAdmin, onExpand }) => {
    const { blobUrl, error: blobError, isConverting } = useBase64ToBlobUrl(content.body);
    const displayUrl = blobUrl || content.body;
    const isDataUrl = content.body.startsWith('data:application/pdf');

    // Responsive initial scale - 65% on mobile, 150% on desktop
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const initialScale = isMobile ? 0.65 : 1.5;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 relative h-full flex flex-col">
            <div className="absolute top-4 right-4 flex gap-2 z-20">
                {isDataUrl && (
                    <button onClick={() => onExpand(displayUrl)} className={`${isMobile ? 'p-3' : 'p-2'} rounded-full bg-white/50 dark:bg-black/50 hover:bg-white/80 dark:hover:bg-black/80 backdrop-blur-sm shadow-md`} title="View Fullscreen">
                        <ExpandIcon className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} text-gray-600 dark:text-gray-300`} />
                    </button>
                )}
                {isAdmin && (
                    <button onClick={onRemove} className={`${isMobile ? 'p-3' : 'p-2'} rounded-full bg-white/50 dark:bg-black/50 hover:bg-white/80 dark:hover:bg-black/80 backdrop-blur-sm shadow-md`} title="Remove Book">
                        <TrashIcon className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} text-gray-600 dark:text-gray-300`} />
                    </button>
                )}
            </div>

            <h2 className="text-lg font-semibold mb-4 pr-24 shrink-0 text-gray-800 dark:text-white truncate" title={content.title}>{content.title}</h2>

            {isDataUrl ? (
                <div className="flex-1 overflow-hidden rounded border dark:border-gray-700 bg-gray-100 dark:bg-gray-900 relative">
                    {blobError ? (
                        <div className="flex items-center justify-center h-full text-red-500 bg-red-50 dark:bg-red-900/20 p-8">
                            <div className="text-center">
                                <div className="bg-red-500 text-white rounded-full p-2 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold mb-2">PDF Processing Error</h3>
                                <p className="text-sm">{blobError}</p>
                            </div>
                        </div>
                    ) : blobUrl ? (
                        <PdfViewer
                            url={blobUrl}
                            initialScale={initialScale}
                        />
                    ) : isConverting ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                <p>Converting PDF...</p>
                                <p className="text-xs text-gray-400 mt-1">Optimizing for faster viewing</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                <p>Preparing PDF...</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="aspect-[8.5/11] w-full bg-gray-200 dark:bg-gray-700 rounded border dark:border-gray-600 flex flex-col items-center justify-center text-center p-4">
                    <BookIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
                    <p className="text-gray-600 dark:text-gray-300 font-semibold">Cannot display PDF</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">This book is referencing a mock file path and cannot be opened.</p>
                    <p className="text-xs text-gray-400 mt-1 truncate max-w-full">({content.body})</p>
                </div>
            )}
        </div>
    );
};

const UploadForm: React.FC<{ lessonId: string; onUpload: () => void; onExpand: (url: string) => void; }> = ({ lessonId, onUpload, onExpand }) => {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [autoTitle, setAutoTitle] = useState('Loading title...');
    const [folderPath, setFolderPath] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useToast();

    // Responsive initial scale - 65% on mobile, 50% on desktop
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const initialScale = isMobile ? 0.65 : 0.5;

    // Optimized Path and Title Logic - Fast loading with minimal API calls
    useEffect(() => {
        const fetchTitleAndPath = async () => {
            try {
                //console.log('=== FAST BOOK PATH GENERATION START ===');

                // Strategy 1: Try breadcrumbs first (fastest for lessons)
                const breadcrumbs = await api.getBreadcrumbs(lessonId);
                if (breadcrumbs && breadcrumbs.trim()) {
                    const parts = breadcrumbs.split(' > ').filter(part => part.trim());
                    if (parts.length >= 2) {
                        const fileName = parts[parts.length - 1];
                        const hierarchyPath = parts.join('/');
                        const cleanSubjectNameLower = parts[1].toLowerCase().replace(/\s+/g, '');
                        const cleanUnitNameFormatted = parts[2].replace(/\s+/g, '');
                        const fullVirtualPath = `../uploads/${parts[0]}/${cleanSubjectNameLower}/${cleanUnitNameFormatted}/Books/${fileName}.pdf`;

                        //console.log('Fast book path from breadcrumbs:', fullVirtualPath);
                        setAutoTitle(fileName);
                        setFolderPath(fullVirtualPath);
                        return;
                    }
                }

                //console.log('Breadcrumbs failed, trying fast search...');

                // Strategy 2: Fast identification with minimal calls
                let foundLevel = false;
                let breadcrumbParts: string[] = [];
                let fileName = 'New Book';

                // Get all classes first (usually just 2-3)
                const classes = await api.getClasses();

                // Try each class - parallel approach would be better but this is still fast
                for (const classItem of classes) {
                    const subjects = await api.getSubjectsByClassId(classItem._id);

                    for (const subject of subjects) {
                        const units = await api.getUnitsBySubjectId(subject._id);

                        // Check if lessonId matches any unit directly
                        const unit = units.find(u => u._id === lessonId);
                        if (unit) {
                            breadcrumbParts = [classItem.name, subject.name, unit.name];
                            fileName = unit.name;
                            foundLevel = true;
                            break;
                        }

                        // Check subUnits
                        for (const unitItem of units) {
                            const subUnits = await api.getSubUnitsByUnitId(unitItem._id);

                            const subUnit = subUnits.find(su => su._id === lessonId);
                            if (subUnit) {
                                breadcrumbParts = [classItem.name, subject.name, unitItem.name, subUnit.name];
                                fileName = subUnit.name;
                                foundLevel = true;
                                break;
                            }

                            // Only check lessons if we haven't found it yet
                            if (!foundLevel) {
                                for (const subUnitItem of subUnits) {
                                    const lessons = await api.getLessonsBySubUnitId(subUnitItem._id);
                                    const lesson = lessons.find(l => l._id === lessonId);
                                    if (lesson) {
                                        // Should have been caught by breadcrumbs, but just in case
                                        breadcrumbParts = [classItem.name, subject.name, unitItem.name, subUnitItem.name, lesson.name];
                                        fileName = lesson.name;
                                        foundLevel = true;
                                        break;
                                    }
                                }
                            }
                        }

                        if (foundLevel) break;
                    }
                    if (foundLevel) break;
                }

                // Generate final path
                if (foundLevel && breadcrumbParts.length > 0) {
                    const hierarchyPath = breadcrumbParts.join('/');
                    const cleanSubjectNameLower = breadcrumbParts[1].toLowerCase().replace(/\s+/g, '');
                    const cleanUnitNameFormatted = breadcrumbParts[2].replace(/\s+/g, '');
                    const fullVirtualPath = `../uploads/${breadcrumbParts[0]}/${cleanSubjectNameLower}/${cleanUnitNameFormatted}/Books/${fileName}.pdf`;

                    //console.log('Fast book path from search:', fullVirtualPath);
                    setAutoTitle(fileName);
                    setFolderPath(fullVirtualPath);
                } else {
                    // Quick fallback
                    //console.log('Quick book fallback for:', lessonId);
                    const fallbackTitle = `Book_${lessonId.slice(-4)}`;
                    const fallbackPath = `../uploads/Class/default/Unit/Books/${fallbackTitle}.pdf`;

                    setAutoTitle(fallbackTitle);
                    setFolderPath(fallbackPath);
                }

            } catch (e) {
                //console.error('Fast book path generation error:', e);
                setAutoTitle('New Book');
                setFolderPath('Default/Book/New Book.pdf');
            }
        };

        if (lessonId) {
            // No timeout delay for faster response
            fetchTitleAndPath();
        } else {
            setAutoTitle('Select a lesson/unit first');
            setFolderPath('../uploads/Class/Pending/Unit/Books/Pending Selection.pdf');
        }
    }, [lessonId]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type === "application/pdf") {
                setFile(selectedFile);
                const objectUrl = URL.createObjectURL(selectedFile);
                setPreviewUrl(objectUrl);
            } else {
                showToast("Please select a valid PDF file.", 'error');
                setFile(null);
                setPreviewUrl(null);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !autoTitle || isSaving) return;

        setIsSaving(true);

        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const base64Data = reader.result as string;
                await api.addContent({
                    title: autoTitle,
                    body: base64Data,
                    lessonId,
                    type: 'book',
                    metadata: { category: 'Custom', subCategory: folderPath } as any
                });
                showToast('Book uploaded successfully!', 'success');
                onUpload();
            } catch (err) {
                showToast('Failed to upload book.', 'error');
                setIsSaving(false);
            }
        };
        reader.onerror = () => {
            showToast("Failed to read file.", 'error');
            setIsSaving(false);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800/50 p-8 rounded-lg shadow-md h-full flex flex-col overflow-hidden">
            <h3 className="text-lg font-semibold text-center mb-1 text-gray-800 dark:text-white shrink-0">Upload New Book</h3>
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-2 shrink-0">File will be saved as: <span className="font-mono font-medium text-blue-600 dark:text-blue-400">{autoTitle}</span></p>
            <p className="text-xs text-center text-gray-400 dark:text-gray-500 mb-6 shrink-0 font-mono truncate" title={folderPath}>Folder: {folderPath}</p>

            <div className="grid md:grid-cols-2 gap-8 items-start flex-1 overflow-y-auto pr-2">
                <form onSubmit={handleSubmit} className="space-y-6 shrink-0">
                    <div>
                        <label htmlFor="pdfFile" className="block text-sm font-medium text-gray-700 dark:text-gray-300">PDF File</label>
                        <div className="mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                    <label htmlFor="pdfFile" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                        <span>Upload a file</span>
                                        <input id="pdfFile" name="pdfFile" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf" />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-500">{file ? file.name : 'PDF up to 10MB'}</p>
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={!file || isSaving} className="w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
                        <SaveIcon className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} />
                        <span className={isMobile ? 'hidden' : 'inline'}>
                            {isSaving ? 'Saving...' : 'Save Book'}
                        </span>
                    </button>
                </form>

                <div className="flex flex-col h-full overflow-hidden min-h-[300px]">
                    <div className="flex justify-between items-center mb-1 shrink-0">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preview</label>
                        {previewUrl && (
                            <button type="button" onClick={() => onExpand(previewUrl)} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="View Fullscreen">
                                <ExpandIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            </button>
                        )}
                    </div>
                    <div className="flex-1 rounded border dark:border-gray-600 overflow-hidden relative">
                        {previewUrl ? (
                            <PdfViewer
                                url={previewUrl}
                                initialScale={initialScale}
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 rounded">
                                <BookIcon className="w-12 h-12 mb-2" />
                                <p>PDF preview will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const BookView: React.FC<BookViewProps> = ({ lessonId, user }) => {
    const [version, setVersion] = useState(0);

    // Debug logging to track lessonId changes
    useEffect(() => {
        console.log('[BookView] LessonId changed:', lessonId);
    }, [lessonId]);

    const { data: groupedContent, isLoading } = useApi(
        () => api.getContentsByLessonId(lessonId, ['book']),
        [lessonId, version]
    );

    // Debug logging to track content changes
    useEffect(() => {
        console.log('[BookView] Content loaded:', groupedContent);
    }, [groupedContent]);

    const [confirmModalState, setConfirmModalState] = useState<{ isOpen: boolean; onConfirm: (() => void) | null }>({ isOpen: false, onConfirm: null });
    const [fullscreenPdfUrl, setFullscreenPdfUrl] = useState<string | null>(null);
    const { showToast } = useToast();

    const bookContent = groupedContent?.[0]?.docs[0];
    const canEdit = user.role === 'admin' || !!user.canEdit;

    const handleDelete = (contentId: string) => {
        const confirmAction = async () => {
            await api.deleteContent(contentId);
            setVersion(v => v + 1);
            showToast('Book deleted successfully.', 'success');
            setConfirmModalState({ isOpen: false, onConfirm: null });
        };
        setConfirmModalState({ isOpen: true, onConfirm: confirmAction });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full overflow-hidden flex flex-col">
            <div className="hidden sm:flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center">
                    <BookIcon className="w-8 h-8 mr-3 text-blue-500" />
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">Book</h1>
                </div>
            </div>

            <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
                {isLoading && <div className="text-center py-10">Loading book...</div>}

                {!isLoading && bookContent && (
                    <SavedBookViewer
                        content={bookContent}
                        onRemove={() => handleDelete(bookContent._id)}
                        isAdmin={canEdit}
                        onExpand={setFullscreenPdfUrl}
                    />
                )}

                {!isLoading && !bookContent && (
                    canEdit ? (
                        <UploadForm lessonId={lessonId} onUpload={() => setVersion(v => v + 1)} onExpand={setFullscreenPdfUrl} />
                    ) : (
                        <div className="text-center py-20 bg-white dark:bg-gray-800/50 rounded-lg">
                            <BookIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                            <p className="mt-4 text-gray-500">No book available.</p>
                        </div>
                    )
                )}
            </div>

            <ConfirmModal
                isOpen={confirmModalState.isOpen}
                onClose={() => setConfirmModalState({ isOpen: false, onConfirm: null })}
                onConfirm={confirmModalState.onConfirm}
                title="Remove Book"
                message="Are you sure you want to remove this book? This action cannot be undone."
            />
            {fullscreenPdfUrl && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col animate-fade-in h-screen w-screen">
                    {/* Desktop close button - top right */}
                    <div className="hidden md:flex justify-end p-2 bg-black/50 absolute top-0 right-0 z-50 rounded-bl-lg">
                        <button
                            onClick={() => setFullscreenPdfUrl(null)}
                            className="p-2 rounded-full bg-red-600/80 hover:bg-red-500 text-white transition-colors"
                            aria-label="Close fullscreen PDF viewer"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Mobile close button - bottom center */}
                    <div className="md:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
                        <button
                            onClick={() => setFullscreenPdfUrl(null)}
                            className="p-3 rounded-full bg-red-600/80 hover:bg-red-500 text-white transition-colors backdrop-blur-sm shadow-lg"
                            aria-label="Close fullscreen PDF viewer"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="w-full h-full pt-12 md:pt-0">
                        <PdfViewer
                            url={fullscreenPdfUrl}
                            initialScale={2.5}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};