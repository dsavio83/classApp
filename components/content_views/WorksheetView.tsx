import React, { useState, useEffect } from 'react';
import { Content, User } from '../../types';
import { useApi } from '../../hooks/useApi';
import * as api from '../../services/api';
import { WorksheetIcon } from '../icons/ResourceTypeIcons';
import { TrashIcon, UploadCloudIcon, ExpandIcon, XIcon, PlusIcon } from '../icons/AdminIcons';
import { ConfirmModal } from '../ConfirmModal';
import { PdfViewer } from './PdfViewer';
import { useToast } from '../../context/ToastContext';
import '../../worksheet-styles.css';

interface WorksheetViewProps {
    lessonId: string;
    user: User;
}

// Utility to convert Base64 to Blob URL for faster PDF rendering
const useBase64ToBlobUrl = (base64String: string | undefined) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!base64String || !base64String.startsWith('data:application/pdf')) {
            setBlobUrl(null);
            return;
        }

        let url: string | null = null;
        const timer = setTimeout(() => {
            try {
                const parts = base64String.split(',');
                const base64 = parts[1];
                const binaryStr = atob(base64);
                const len = binaryStr.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryStr.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'application/pdf' });
                url = URL.createObjectURL(blob);
                setBlobUrl(url);
            } catch (e) {
                console.error("Failed to convert base64 to blob", e);
                setBlobUrl(base64String);
            }
        }, 0);

        return () => {
            clearTimeout(timer);
            if (url) URL.revokeObjectURL(url);
        };
    }, [base64String]);

    return blobUrl;
};

// Beautiful Simple Card Component - Name Only with PDF Opening
const BeautifulWorksheetCard: React.FC<{ content: Content; onRemove: () => void; isAdmin: boolean; onExpand: (url: string) => void; index: number; }> = ({ content, onRemove, isAdmin, onExpand, index }) => {
    const blobUrl = useBase64ToBlobUrl(content.body);
    const displayUrl = blobUrl || content.body;
    const isDataUrl = content.body.startsWith('data:application/pdf');

    // Beautiful gradient color schemes for each card
    const colorSchemes = [
        { bg: 'from-blue-400 to-purple-600', text: 'text-white', icon: 'bg-white/20' },
        { bg: 'from-green-400 to-blue-600', text: 'text-white', icon: 'bg-white/20' }, 
        { bg: 'from-purple-400 to-pink-600', text: 'text-white', icon: 'bg-white/20' },
        { bg: 'from-red-400 to-orange-600', text: 'text-white', icon: 'bg-white/20' },
        { bg: 'from-indigo-400 to-purple-600', text: 'text-white', icon: 'bg-white/20' },
        { bg: 'from-yellow-400 to-red-600', text: 'text-white', icon: 'bg-white/20' },
        { bg: 'from-pink-400 to-rose-600', text: 'text-white', icon: 'bg-white/20' },
        { bg: 'from-teal-400 to-cyan-600', text: 'text-white', icon: 'bg-white/20' }
    ];
    
    const colorScheme = colorSchemes[index % colorSchemes.length];

    return (
        <div 
            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden cursor-pointer border border-gray-200 dark:border-gray-700"
            onClick={() => onExpand(displayUrl)}
        >
            {/* Beautiful Gradient Header */}
            <div className={`h-24 bg-gradient-to-br ${colorScheme.bg} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/10"></div>
                
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-white/10 rounded-full"></div>
                <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-white/10 rounded-full"></div>
                
                {/* PDF Icon */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className={`p-3 ${colorScheme.icon} rounded-full backdrop-blur-sm shadow-md`}>
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                </div>
                
                {/* Action Buttons */}
                <div className="absolute top-3 right-3 flex gap-2 z-10">
                    {isAdmin && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onRemove(); }}
                            className="p-1.5 rounded-full bg-white/20 hover:bg-red-500/50 backdrop-blur-sm shadow-md transition-all"
                            title="Delete Worksheet"
                        >
                            <TrashIcon className="w-3 h-3 text-white" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6">
                {/* Title */}
                <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-3 text-center line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {content.title}
                </h3>

                {/* Action Hint */}
                <div className="text-center">
                    <span className="text-xs text-blue-500 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to open PDF
                    </span>
                </div>
            </div>
        </div>
    );
};



const UploadForm: React.FC<{ lessonId: string; onUpload: () => void; onExpand: (url: string) => void; onCancel: () => void; existingTitles: string[]; }> = ({ lessonId, onUpload, onExpand, onCancel, existingTitles }) => {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [title, setTitle] = useState('Loading title...');
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useToast();

    // Optimized Path and Title Logic - Fast loading with minimal API calls
    useEffect(() => {
        const fetchTitleAndPath = async () => {
            try {
                console.log('=== FAST WORKSHEET PATH GENERATION START ===');
                
                // Strategy 1: Try breadcrumbs first (fastest for lessons)
                const breadcrumbs = await api.getBreadcrumbs(lessonId);
                if (breadcrumbs && breadcrumbs.trim()) {
                    const parts = breadcrumbs.split(' > ').filter(part => part.trim());
                    if (parts.length >= 2) {
                        const fileName = parts[parts.length - 1];
                        const hierarchyPath = parts.join('/');
                        const cleanSubjectNameLower = parts[1].toLowerCase().replace(/\s+/g, '');
                        const cleanUnitNameFormatted = parts[2].replace(/\s+/g, '');
                        const fullVirtualPath = `../uploads/${parts[0]}/${cleanSubjectNameLower}/${cleanUnitNameFormatted}/Worksheets/${fileName}.pdf`;
                        
                        console.log('Fast worksheet path from breadcrumbs:', fullVirtualPath);
                        setTitle(fileName);
                        return;
                    }
                }
                
                console.log('Breadcrumbs failed, trying fast search...');
                
                // Strategy 2: Fast identification with minimal calls
                let foundLevel = false;
                let breadcrumbParts: string[] = [];
                let fileName = 'New Worksheet';
                
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
                
                // Generate final title
                if (foundLevel && breadcrumbParts.length > 0) {
                    const cleanSubjectNameLower = breadcrumbParts[1].toLowerCase().replace(/\s+/g, '');
                    const cleanUnitNameFormatted = breadcrumbParts[2].replace(/\s+/g, '');
                    const fullVirtualPath = `../uploads/${breadcrumbParts[0]}/${cleanSubjectNameLower}/${cleanUnitNameFormatted}/Worksheets/${fileName}.pdf`;
                    console.log('Fast worksheet path from search:', fullVirtualPath);
                    setTitle(fileName);
                } else {
                    // Quick fallback
                    console.log('Quick worksheet fallback for:', lessonId);
                    const fallbackTitle = `Worksheet_${lessonId.slice(-4)}`;
                    setTitle(fallbackTitle);
                }
                
            } catch (e) {
                console.error('Fast worksheet path generation error:', e);
                setTitle('New Worksheet');
            }
        };
        
        if (lessonId) {
            // No timeout delay for faster response
            fetchTitleAndPath();
        } else {
            setTitle('Select a lesson/unit first');
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
                if (!title || title === 'Loading title...' || title === 'New Worksheet' || title.startsWith('Worksheet_')) {
                    setTitle(selectedFile.name.replace(/\.[^/.]+$/, '')); // Remove extension
                }
            } else {
                showToast("Please select a valid PDF file.", 'error');
                setFile(null);
                setPreviewUrl(null);
            }
        }
    };

    // Function to handle duplicate title resolution
    const resolveDuplicateTitle = (originalTitle: string): string => {
        if (!existingTitles.includes(originalTitle)) {
            return originalTitle;
        }

        let counter = 1;
        let newTitle = `${originalTitle} ${counter}`;
        
        while (existingTitles.includes(newTitle)) {
            counter++;
            newTitle = `${originalTitle} ${counter}`;
        }
        
        return newTitle;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title || isSaving) return;
        
        setIsSaving(true);

        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const base64Data = reader.result as string;
                const finalTitle = resolveDuplicateTitle(title);
                
                if (finalTitle !== title) {
                    showToast(`Title adjusted to avoid duplicate: "${finalTitle}"`, 'info');
                }
                
                await api.addContent({ 
                    title: finalTitle, 
                    body: base64Data, 
                    lessonId, 
                    type: 'worksheet',
                    metadata: { category: 'Custom' } as any 
                });
                showToast('Worksheet uploaded successfully!', 'success');
                onUpload();
                setFile(null);
                setPreviewUrl(null);
                onCancel(); // Auto-hide upload form after successful upload
            } catch (err) {
                showToast('Failed to upload worksheet.', 'error');
            } finally {
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 upload-form-enter">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Upload Worksheet (PDF)</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-1 w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PDF File</label>
                    <div className="mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                                <label htmlFor="worksheet-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                    <span>Upload a file</span>
                                    <input id="worksheet-upload" name="worksheet-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf" />
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-500">{file ? file.name : 'PDF up to 15MB'}</p>
                        </div>
                    </div>
                </div>

                {previewUrl && (
                    <div className="h-64 border rounded overflow-hidden">
                        <PdfViewer url={previewUrl} initialScale={0.6} />
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <button 
                        type="button" 
                        onClick={() => { setFile(null); setPreviewUrl(null); }} 
                        className="px-3 py-2 sm:px-4 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-200" 
                        disabled={isSaving}
                        title="Clear"
                    >
                        <span className="hidden sm:inline">Clear</span>
                        <span className="sm:hidden">🗑️</span>
                    </button>
                    <button 
                        type="submit" 
                        className="px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-md disabled:bg-blue-400" 
                        disabled={isSaving || !file}
                        title={isSaving ? 'Uploading...' : 'Upload Worksheet'}
                    >
                        <span className="hidden sm:inline">{isSaving ? 'Uploading...' : 'Upload Worksheet'}</span>
                        <span className="sm:hidden">📤</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export const WorksheetView: React.FC<WorksheetViewProps> = ({ lessonId, user }) => {
    const [version, setVersion] = useState(0);
    const [showUploadForm, setShowUploadForm] = useState(false);
    
    const { data: groupedContent, isLoading } = useApi(
        () => api.getContentsByLessonId(lessonId, ['worksheet']),
        [lessonId, version]
    );

    const [confirmModalState, setConfirmModalState] = useState<{ isOpen: boolean; onConfirm: (() => void) | null }>({ isOpen: false, onConfirm: null });
    const [fullscreenPdfUrl, setFullscreenPdfUrl] = useState<string | null>(null);
    const { showToast } = useToast();

    const worksheetContents = groupedContent?.[0]?.docs || [];
    const canEdit = user.role === 'admin' || !!user.canEdit;

    const handleDelete = (contentId: string) => {
        const confirmAction = async () => {
            await api.deleteContent(contentId);
            setVersion(v => v + 1);
            showToast('Worksheet deleted successfully.', 'success');
            setConfirmModalState({ isOpen: false, onConfirm: null });
        };
        setConfirmModalState({ isOpen: true, onConfirm: confirmAction });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center">
                    <WorksheetIcon className="w-8 h-8 mr-3 text-blue-500" />
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">Worksheets</h1>
                </div>
                <div className="flex items-center gap-3">
                    {canEdit && (
                        <button 
                            onClick={() => setShowUploadForm(!showUploadForm)} 
                            className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            title={showUploadForm ? 'Cancel' : 'Add Worksheet'}
                        >
                            <PlusIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">{showUploadForm ? 'Cancel' : 'Add Worksheet'}</span>
                        </button>
                    )}
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-0">
                {isLoading && <div className="text-center py-10">Loading worksheets...</div>}
                
                {showUploadForm && canEdit && (
                    <UploadForm 
                        lessonId={lessonId} 
                        onUpload={() => setVersion(v => v + 1)} 
                        onExpand={setFullscreenPdfUrl}
                        existingTitles={worksheetContents.map(item => item.title)}
                        onCancel={() => setShowUploadForm(false)}
                    />
                )}

                {!isLoading && worksheetContents.length > 0 && (
                    <div className="pb-6">
                        {/* Beautiful Card Grid - 2 columns per row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
                            {worksheetContents.map((item, index) => (
                                <BeautifulWorksheetCard
                                    key={item._id}
                                    content={item}
                                    onRemove={() => handleDelete(item._id)}
                                    isAdmin={canEdit}
                                    onExpand={setFullscreenPdfUrl}
                                    index={index}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {!isLoading && worksheetContents.length === 0 && (
                    <div className="text-center py-20 bg-white dark:bg-gray-800/50 rounded-lg">
                        <WorksheetIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                        <p className="mt-4 text-gray-500">No worksheets available for this chapter.</p>
                        
                    </div>
                )}
            </div>
            
            <ConfirmModal 
                isOpen={confirmModalState.isOpen}
                onClose={() => setConfirmModalState({ isOpen: false, onConfirm: null })}
                onConfirm={confirmModalState.onConfirm}
                title="Delete Worksheet"
                message="Are you sure you want to delete this worksheet? This action cannot be undone."
            />
             
            {fullscreenPdfUrl && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col animate-fade-in h-screen w-screen">
                    <div className="flex justify-end p-2 bg-black/50 absolute top-0 right-0 z-50 rounded-bl-lg">
                        <button 
                            onClick={() => setFullscreenPdfUrl(null)} 
                            className="p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                            aria-label="Close fullscreen PDF viewer"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="w-full h-full">
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