import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Content, User, ResourceType } from '../../types';
import { useApi } from '../../hooks/useApi';
import * as api from '../../services/api';
import { PlusIcon, EditIcon, TrashIcon, ChevronRightIcon, UploadCloudIcon, ExpandIcon, XIcon } from '../icons/AdminIcons';
import { ConfirmModal } from '../ConfirmModal';
import { RESOURCE_TYPES } from '../../constants';
import { PdfViewer } from './PdfViewer';
import { useToast } from '../../context/ToastContext';
import { useSession } from '../../context/SessionContext';
import { FontSizeControl } from '../FontSizeControl';
import { FileUploadHelper } from '../../services/fileStorage';
import path from 'path';
import { processContentForHTML } from '../../utils/htmlUtils';

declare const Quill: any;

interface GenericContentViewProps {
    lessonId: string;
    user: User;
    resourceType: ResourceType;
}

// ... (GenericEditorModal and ContentCard remain same)
// --- Generic Editor Modal (Rich Text for both Title and Content) ---
interface GenericEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { title: string; body: string }) => Promise<void>;
    contentToEdit: Content | null;
    resourceLabel: string;
    resourceType: ResourceType;
}

const GenericEditorModal: React.FC<GenericEditorModalProps> = ({ isOpen, onClose, onSave, contentToEdit, resourceLabel, resourceType }) => {
    const [activeTab, setActiveTab] = useState<'title' | 'content'>('title');
    const [titleHtml, setTitleHtml] = useState('');
    const [bodyHtml, setBodyHtml] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const editorContainerRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<any>(null);

    const isActivity = resourceType === 'activity' || resourceType === 'extra';
    const titleLabel = isActivity ? 'Question' : 'Title';
    const contentLabel = isActivity ? 'Answer' : 'Content';

    // Initialize editor and load content when modal opens
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        console.log('[GenericEditor] Initializing for edit:', contentToEdit ? 'existing content' : 'new content');
        console.log('[GenericEditor] Full contentToEdit object:', contentToEdit);
        console.log('[GenericEditor] Title content:', contentToEdit?.title ? contentToEdit.title.substring(0, 100) + '...' : '(empty/null)');
        console.log('[GenericEditor] Body content:', contentToEdit?.body ? contentToEdit.body.substring(0, 100) + '...' : '(empty/null)');
        console.log('[GenericEditor] Body content length:', contentToEdit?.body?.length || 0);
        console.log('[GenericEditor] Body content type:', typeof contentToEdit?.body);
        console.log('[GenericEditor] Body content exists:', !!contentToEdit?.body);

        // Reset state for new session
        setIsInitialized(false);
        setActiveTab('title');
        
        // Load content from contentToEdit with proper mapping for activities
        const rawTitle = contentToEdit ? contentToEdit.title : '';
        const rawBody = contentToEdit ? contentToEdit.body : '';
        
        // For activities, ensure Question and Answer are properly mapped
        let questionContent = '';
        let answerContent = '';
        
        if (isActivity) {
            // For activities: Question should be in title, Answer should be in body
            questionContent = rawTitle;
            answerContent = rawBody;
            
            // Add verification to ensure content is not swapped
            if (rawTitle && rawBody && rawTitle.length > 0 && rawBody.length > 0) {
                // If both exist, verify they are different content
                if (rawTitle.trim() === rawBody.trim()) {
                    console.warn('[GenericEditor] WARNING: Question and Answer content are identical!');
                }
            }
        } else {
            // For non-activities: title is title, body is content
            questionContent = rawTitle;
            answerContent = rawBody;
        }
        
        console.log('[GenericEditor] Content mapping for activity:', isActivity);
        console.log('[GenericEditor] Raw titleContent:', rawTitle ? rawTitle.substring(0, 100) + '...' : '(empty)');
        console.log('[GenericEditor] Raw bodyContent:', rawBody ? rawBody.substring(0, 100) + '...' : '(empty)');
        console.log('[GenericEditor] Mapped Question content:', questionContent ? questionContent.substring(0, 100) + '...' : '(empty)');
        console.log('[GenericEditor] Mapped Answer content:', answerContent ? answerContent.substring(0, 100) + '...' : '(empty)');
        console.log('[GenericEditor] Setting titleHtml (Question) state, length:', questionContent.length);
        console.log('[GenericEditor] Setting bodyHtml (Answer) state, length:', answerContent.length);
        
        // Set states with proper mapping
        setTitleHtml(questionContent); // Question content
        setBodyHtml(answerContent);    // Answer content
        
        console.log('[GenericEditor] States set. Question:', questionContent.length, 'Answer:', answerContent.length);
        
        // Initialize Quill editor if not already done
        if (editorContainerRef.current && !quillRef.current) {
            console.log('[GenericEditor] Initializing Quill editor');
            
            const quill = new Quill(editorContainerRef.current, {
                theme: 'snow',
                modules: {
                    toolbar: [
                        ['bold', 'italic', 'underline', 'strike'],
                        ['blockquote', 'code-block'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        [{ 'script': 'sub' }, { 'script': 'super' }],
                        [{ 'color': [] }, { 'background': [] }],
                        ['image', 'video', 'formula'],
                        ['clean']
                    ]
                },
                placeholder: 'Enter content...',
            });
            
            // Load initial content based on active tab (using mapped content)
            const initialContent = activeTab === 'title' ? questionContent : answerContent;
            console.log('[GenericEditor] Setting initial content for', activeTab, ':', initialContent ? initialContent.substring(0, 100) + '...' : '(empty)');
            console.log('[GenericEditor] Question content available:', !!questionContent, 'Answer content available:', !!answerContent);
            quill.root.innerHTML = initialContent || '';
            
            quillRef.current = quill;
            setIsInitialized(true);
            
            console.log('[GenericEditor] Editor initialized successfully');
            
            // Ensure content is properly loaded after a brief delay
            setTimeout(() => {
                if (quillRef.current && isOpen) {
                    const contentToLoad = activeTab === 'title' ? questionContent : answerContent;
                    if (quillRef.current.root.innerHTML !== contentToLoad) {
                        console.log('[GenericEditor] Correcting initial content load');
                        quillRef.current.root.innerHTML = contentToLoad || '';
                    }
                }
            }, 100);
        }
    }, [isOpen, contentToEdit]);

    // Cleanup when modal closes
    useEffect(() => {
        return () => {
            if (!isOpen) {
                console.log('[GenericEditor] Cleaning up editor');
                quillRef.current = null;
                setIsInitialized(false);
            }
        };
    }, [isOpen]);

    // Load content when tab changes - Ensure both title and body are properly loaded
    useEffect(() => {
        if (quillRef.current && isInitialized && isOpen) {
            const contentToLoad = activeTab === 'title' ? titleHtml : bodyHtml;
            const currentContent = quillRef.current.root.innerHTML;
            
            console.log('[GenericEditor] Tab changed to', activeTab);
            console.log('[GenericEditor] Content to load:', contentToLoad ? contentToLoad.substring(0, 100) + '...' : '(empty)');
            console.log('[GenericEditor] Current content:', currentContent ? currentContent.substring(0, 100) + '...' : '(empty)');
            console.log('[GenericEditor] BodyHtml state:', bodyHtml ? bodyHtml.substring(0, 100) + '...' : '(empty)');
            
            if (currentContent !== contentToLoad) {
                console.log('[GenericEditor] Loading content into Quill editor');
                quillRef.current.root.innerHTML = contentToLoad || '';
            }
        }
    }, [activeTab, isInitialized, titleHtml, bodyHtml, isOpen]);

    // Additional effect to ensure content is loaded when editor becomes available
    useEffect(() => {
        if (quillRef.current && isInitialized && isOpen && (activeTab === 'title' || activeTab === 'content')) {
            const contentToLoad = activeTab === 'title' ? titleHtml : bodyHtml;
            if (contentToLoad && quillRef.current.root.innerHTML !== contentToLoad) {
                console.log('[GenericEditor] Ensuring content is loaded for tab:', activeTab);
                quillRef.current.root.innerHTML = contentToLoad;
            }
        }
    }, [isInitialized, activeTab, titleHtml, bodyHtml, isOpen]);

    const handleTabSwitch = (newTab: 'title' | 'content') => {
        if (newTab === activeTab || !quillRef.current || !isInitialized) return;
        
        console.log('[GenericEditor] Switching from', activeTab, 'to', newTab);
        
        // Save current tab content before switching
        const currentContent = quillRef.current.root.innerHTML;
        console.log('[GenericEditor] Saving current content before switch:', currentContent.substring(0, 100) + '...');
        
        if (activeTab === 'title') {
            setTitleHtml(currentContent);
            console.log('[GenericEditor] Saved title content');
        } else {
            setBodyHtml(currentContent);
            console.log('[GenericEditor] Saved body content');
        }
        
        // Switch to new tab
        setActiveTab(newTab);
        console.log('[GenericEditor] Tab switched to:', newTab);
        
        // Force load the new content immediately for better UX
        setTimeout(() => {
            if (quillRef.current) {
                // Use the content from state variables for more reliable loading
                let contentToLoad = '';
                let tabName = '';
                if (newTab === 'title') {
                    contentToLoad = titleHtml;  // Question content
                    tabName = 'Question';
                    console.log('[GenericEditor] Force loading', tabName, 'content, length:', contentToLoad.length);
                } else {
                    contentToLoad = bodyHtml;   // Answer content
                    tabName = 'Answer';
                    console.log('[GenericEditor] Force loading', tabName, 'content, length:', contentToLoad.length);
                    console.log('[GenericEditor] Answer content preview:', contentToLoad.substring(0, 100) + '...');
                }
                
                // Force set the content even if it's empty to ensure proper state
                quillRef.current.root.innerHTML = contentToLoad;
                console.log('[GenericEditor]', tabName, 'content set in editor, current length:', quillRef.current.root.innerHTML.length);
            }
        }, 50);
    };

    const handleSaveClick = async () => {
        if (isSaving) return;

        let finalTitle = titleHtml;
        let finalBody = bodyHtml;

        if (quillRef.current) {
            const currentContent = quillRef.current.root.innerHTML;
            if (activeTab === 'title') finalTitle = currentContent;
            else finalBody = currentContent;
        }

        if (!finalTitle.trim() || !finalBody.trim()) {
            alert(`Both ${titleLabel} and ${contentLabel} are required.`);
            return;
        }

        setIsSaving(true);
        await onSave({ title: finalTitle, body: finalBody });
        setTitleHtml('');
        setBodyHtml('');
        if (quillRef.current) quillRef.current.root.innerHTML = '';
        setIsSaving(false);
    };

    const handleClose = () => {
        setTitleHtml('');
        setBodyHtml('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">{contentToEdit ? `Edit ${resourceLabel}` : `Add New ${resourceLabel}`}</h2>
                    <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>
                <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <button
                        className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${activeTab === 'title' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-t-2 border-blue-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        onClick={() => handleTabSwitch('title')}
                    >
                        {titleLabel}
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${activeTab === 'content' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-t-2 border-blue-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        onClick={() => handleTabSwitch('content')}
                    >
                        {contentLabel}
                    </button>
                </div>
                <div className="flex-1 flex flex-col p-4 overflow-hidden bg-white dark:bg-gray-800">
                    <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 flex-1 flex flex-col overflow-hidden text-gray-900 dark:text-gray-100">
                        <div ref={editorContainerRef} className="flex-1 overflow-y-auto" style={{ minHeight: '200px' }}></div>
                    </div>
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
                    <button onClick={handleClose} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600" disabled={isSaving}>Cancel</button>
                    <button onClick={handleSaveClick} className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400" disabled={isSaving}>
                        {isSaving ? 'Saving...' : `Save ${resourceLabel}`}
                    </button>
                </div>
            </div>
        </div>
    );
};


const ContentCard: React.FC<{ item: Content; onEdit: (c: Content) => void; onDelete: (id: string) => void; isAdmin: boolean; onExpandPdf?: (url: string) => void }> = ({ item, onEdit, onDelete, isAdmin, onExpandPdf }) => {
    const [isOpen, setIsOpen] = useState(false);
    // Check if this is a PDF-based content (either has fileId or is worksheet with file metadata)
    const isPdf = item.type === 'worksheet' && (item.metadata as any)?.fileId;
    const { session } = useSession();

    const fontStyle = { fontSize: `${session.fontSize}px` };

    // Helper to get PDF URL for worksheet PDFs
    const getPdfUrl = () => {
        try {
            // For file-based worksheets
            if ((item.metadata as any)?.fileId) {
                const fileUrl = FileUploadHelper.getFileUrl((item.metadata as any).fileId);
                if (fileUrl) {
                    console.log('Generated PDF URL for worksheet:', fileUrl);
                    return fileUrl;
                }
            }

            // Fallback to legacy base64 system if present
            if (item.body && item.body.startsWith('data:application/pdf')) {
                console.log('Using base64 PDF data');
                return item.body;
            }

            // If content has a filePath, try to construct URL from it
            if (item.filePath) {
                // Extract filename from path and create API URL
                const path = require('path');
                const filename = path.basename(item.filePath);
                const fileUrl = `/api/files/${filename}`;
                console.log('Generated PDF URL from filePath:', fileUrl);
                return fileUrl;
            }

            console.warn('No valid PDF URL found for item:', item._id, item.metadata);
            return null;
        } catch (e) {
            console.error('Error generating PDF URL:', e);
            return null;
        }
    };

    const pdfUrl = isPdf ? getPdfUrl() : null;

    if (isPdf) {
        return (
            <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 flex flex-col h-64 sm:h-80 hover:scale-[1.02] transition-transform"
                onClick={() => onExpandPdf && onExpandPdf(pdfUrl || '')}
            >
                <div className="flex-1 bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden relative">
                    {pdfUrl ? (
                        <div className="w-full h-full pointer-events-none">
                            <PdfViewer url={pdfUrl} initialScale={0.4} />
                        </div>
                    ) : (
                        <div className="text-center p-3 sm:p-4">
                            <div className="text-red-400 text-xs sm:text-sm mb-2">Failed to load PDF</div>
                            <div className="text-xs text-gray-500">Click to retry or delete</div>
                        </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors"></div>
                </div>
                <div className="p-2 sm:p-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 shrink-0">
                    <h3 className="font-medium text-sm text-gray-800 dark:text-white truncate flex-1 pr-2" title={item.title}>{item.title}</h3>
                    {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                            <button onClick={() => onDelete(item._id)} className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                                <TrashIcon className="w-4 h-4" />
                                <span className="hidden sm:inline ml-1 text-xs">Delete</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-3 sm:mb-4">
            <div className="w-full text-left p-3 sm:p-4 flex justify-between items-center group cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <div className="flex-1 pr-4">
                    {/* Dynamic Font Size Applied Here */}
                    <div className="font-semibold text-gray-800 dark:text-white prose prose-sm dark:prose-invert max-w-none" style={fontStyle} dangerouslySetInnerHTML={{ __html: processContentForHTML(item.title) }} />
                </div>
                <div className="flex items-center shrink-0">
                    {isAdmin && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2 sm:mr-4" onClick={e => e.stopPropagation()}>
                            <button onClick={() => onEdit(item)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Edit">
                                <EditIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                <span className="hidden sm:inline sm:ml-2 text-xs">Edit</span>
                            </button>
                            <button onClick={() => onDelete(item._id)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title="Delete">
                                <TrashIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                <span className="hidden sm:inline sm:ml-2 text-xs">Delete</span>
                            </button>
                        </div>
                    )}
                    <ChevronRightIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </div>
            </div>
            {isOpen && (
                <div className="p-3 sm:p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    {/* Dynamic Font Size Applied Here */}
                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400" style={fontStyle} dangerouslySetInnerHTML={{ __html: processContentForHTML(item.body) }} />
                </div>
            )}
        </div>
    );
};

// --- PDF Upload Form Component ---
// Added lessonId to props for auto-title and path generation
const PdfUploadForm: React.FC<{ onSave: (data: { title: string; body: string; metadata?: any }) => Promise<void>; onCancel: () => void; lessonId: string; }> = ({ onSave, onCancel, lessonId }) => {
    const [title, setTitle] = useState('Loading title...');
    const [file, setFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [folderPath, setFolderPath] = useState('');
    const { showToast } = useToast();

    // Optimized Path and Title Logic - Fast loading with minimal API calls
    useEffect(() => {
        const fetchTitleAndPath = async () => {
            try {
                console.log('=== FAST PATH GENERATION START ===');

                // Strategy 1: Try breadcrumbs first (fastest for lessons)
                const breadcrumbs = await api.getBreadcrumbs(lessonId);
                if (breadcrumbs && breadcrumbs.trim()) {
                    const parts = breadcrumbs.split(' > ').filter(part => part.trim());
                    if (parts.length >= 2) {
                        const fileName = parts[parts.length - 1];
                        const hierarchyPath = parts.join('/');
                        const fullVirtualPath = `${hierarchyPath}/Worksheet/${fileName}.pdf`;

                        console.log('Fast path from breadcrumbs:', fullVirtualPath);
                        setTitle(fileName);
                        setFolderPath(fullVirtualPath);
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

                // Generate final path
                if (foundLevel && breadcrumbParts.length > 0) {
                    const hierarchyPath = breadcrumbParts.join('/');
                    const fullVirtualPath = `${hierarchyPath}/Worksheet/${fileName}.pdf`;

                    console.log('Fast path from search:', fullVirtualPath);
                    setTitle(fileName);
                    setFolderPath(fullVirtualPath);
                } else {
                    // Quick fallback
                    console.log('Quick fallback for:', lessonId);
                    const fallbackTitle = `Worksheet_${lessonId.slice(-4)}`;
                    const fallbackPath = `Class/Worksheet/${fallbackTitle}.pdf`;

                    setTitle(fallbackTitle);
                    setFolderPath(fallbackPath);
                }

            } catch (e) {
                console.error('Fast path generation error:', e);
                setTitle('New Worksheet');
                setFolderPath('Default/Worksheet/New Worksheet.pdf');
            }
        };

        if (lessonId) {
            // No timeout delay for faster response
            fetchTitleAndPath();
        } else {
            setTitle('Select a lesson/unit first');
            setFolderPath('Worksheets/Pending Selection');
        }
    }, [lessonId]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        }
    }, [previewUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            const url = URL.createObjectURL(selectedFile);
            setPreviewUrl(url);
        } else if (selectedFile) {
            showToast("Please select a valid PDF file.", 'error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title || isSaving) return;

        setIsSaving(true);
        try {
            // Upload and store the file using the new file storage system
            const uploadResult = await FileUploadHelper.uploadFile(
                file,
                lessonId,
                'worksheet',
                title,
                { folderPath, fileName: file.name }
            );

            // Save content with proper metadata
            const contentData = {
                title,
                body: FileUploadHelper.getFileUrl(uploadResult.fileId) || '',
                metadata: {
                    fileId: uploadResult.fileId,
                    filePath: uploadResult.path,
                    fileName: file.name,
                    fileSize: file.size,
                    uploadDate: new Date().toISOString()
                }
            };

            await onSave(contentData);
            showToast("Worksheet saved successfully!", 'success');
        } catch (error) {
            console.error("Save failed", error);
            showToast("Failed to save worksheet.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
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
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono truncate" title={folderPath}>
                        Virtual Path: {folderPath}
                    </p>
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
                            <p className="text-xs text-gray-500 dark:text-gray-500">{file ? file.name : 'PDF up to 10MB'}</p>
                        </div>
                    </div>
                </div>

                {previewUrl && (
                    <div className="h-64 border rounded overflow-hidden">
                        <PdfViewer url={previewUrl} initialScale={0.6} />
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-200" disabled={isSaving}>Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-400" disabled={isSaving || !file}>
                        {isSaving ? 'Uploading...' : 'Save Worksheet'}
                    </button>
                </div>
            </form>
        </div>
    );
};


export const GenericContentView: React.FC<GenericContentViewProps> = ({ lessonId, user, resourceType }) => {
    const [version, setVersion] = useState(0);
    const { data: groupedContent, isLoading } = useApi(() => api.getContentsByLessonId(lessonId, [resourceType]), [lessonId, version, resourceType]);

    const [modalState, setModalState] = useState<{ isOpen: boolean; content: Content | null }>({ isOpen: false, content: null });
    const [confirmModalState, setConfirmModalState] = useState<{ isOpen: boolean; onConfirm: (() => void) | null }>({ isOpen: false, onConfirm: null });
    const [isAddingPdf, setIsAddingPdf] = useState(false);
    const [fullscreenPdfUrl, setFullscreenPdfUrl] = useState<string | null>(null);
    const { showToast } = useToast();

    const contentItems = groupedContent?.[0]?.docs || [];
    const resourceInfo = RESOURCE_TYPES.find(r => r.key === resourceType) || { key: resourceType, label: resourceType, Icon: () => null };
    const canEdit = user.role === 'admin' || !!user.canEdit;
    const isWorksheet = resourceType === 'worksheet';

    const handleSave = async (contentData: { title: string; body: string; metadata?: any }) => {
        try {
            if (modalState.content) {
                // For worksheet content, preserve the metadata
                const updatedContent: any = { ...contentData };
                if (modalState.content.metadata && (modalState.content.metadata as any).fileId) {
                    updatedContent.metadata = modalState.content.metadata;
                }
                await api.updateContent(modalState.content._id, updatedContent);
            } else {
                // For new worksheet content with metadata (file upload), save with metadata
                if (isWorksheet && contentData.metadata) {
                    await api.addContent({
                        title: contentData.title,
                        body: contentData.body || '', // Use provided body or empty string
                        metadata: contentData.metadata,
                        lessonId,
                        type: resourceType
                    });
                } else {
                    await api.addContent({ ...contentData, lessonId, type: resourceType });
                }
            }
            setVersion(v => v + 1);
            showToast(`${resourceInfo.label} saved successfully!`, 'success');
        } catch (e) {
            showToast('Failed to save content.', 'error');
        }
        setModalState({ isOpen: false, content: null });
        setIsAddingPdf(false);
    };

    const handleDelete = (contentId: string) => {
        const confirmAction = async () => {
            try {
                await api.deleteContent(contentId);
                setVersion(v => v + 1);
                showToast(`${resourceInfo.label} deleted.`, 'error');
            } catch (e) {
                showToast('Failed to delete content.', 'error');
            }
            setConfirmModalState({ isOpen: false, onConfirm: null });
        };
        setConfirmModalState({ isOpen: true, onConfirm: confirmAction });
    };

    const handleAddClick = () => {
        if (isWorksheet) {
            setIsAddingPdf(true);
        } else {
            setModalState({ isOpen: true, content: null });
        }
    };

    return (
        <div className="p-2 sm:p-4 lg:p-6 xl:p-8 h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center">
                    <resourceInfo.Icon className="w-8 h-8 mr-3 text-blue-500" />
                    {/* Page Title in Body Section */}
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">{resourceInfo.label}</h1>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                    {/* Added Font Size Control here too - Hidden for Worksheets */}
                    {!isWorksheet && <FontSizeControl />}

                    {canEdit && !isAddingPdf && (
                        <button onClick={handleAddClick} className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" title={`Add New ${resourceInfo.label}`}>
                            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="hidden sm:inline">Add New</span>
                        </button>
                    )}
                </div>
            </div>         
            

            <div className="flex-1 overflow-y-auto min-h-0">
                {isLoading && <div className="text-center py-10">Loading content...</div>}

                {isAddingPdf && (
                    // Passing lessonId to PdfUploadForm for path generation
                    <PdfUploadForm onSave={handleSave} onCancel={() => setIsAddingPdf(false)} lessonId={lessonId} />
                )}

                {!isLoading && !isAddingPdf && contentItems.length > 0 && (
                    // Responsive Grid for Worksheets (PDFs), List for others - Larger grid
                    <div className={isWorksheet ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8 pb-6" : "space-y-3 sm:space-y-4 pb-6"}>
                        {contentItems.map(item => {
                            console.log('[GenericContentView] Content item:', {
                                id: item._id,
                                title: item.title?.substring(0, 50) + '...',
                                body: item.body?.substring(0, 50) + '...',
                                bodyLength: item.body?.length || 0,
                                type: item.type
                            });
                            return (
                                <ContentCard
                                    key={item._id}
                                    item={item}
                                    onEdit={(c) => {
                                        console.log('[GenericContentView] Edit clicked for item:', {
                                            id: c._id,
                                            title: c.title?.substring(0, 50) + '...',
                                            body: c.body?.substring(0, 50) + '...',
                                            bodyLength: c.body?.length || 0
                                        });
                                        setModalState({ isOpen: true, content: c })
                                    }}
                                    onDelete={handleDelete}
                                    isAdmin={canEdit}
                                    onExpandPdf={setFullscreenPdfUrl}
                                />
                            );
                        })}
                    </div>
                )}

                {!isLoading && !isAddingPdf && contentItems.length === 0 && (
                    <div className="text-center py-20 bg-white dark:bg-gray-800/50 rounded-lg">
                        <resourceInfo.Icon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                        <p className="mt-4 text-gray-500">No {resourceInfo.label.toLowerCase()} available for this chapter.</p>
                    </div>
                )}
            </div>

            <GenericEditorModal isOpen={modalState.isOpen} onClose={() => setModalState({ isOpen: false, content: null })} onSave={handleSave} contentToEdit={modalState.content} resourceLabel={resourceInfo.label} resourceType={resourceType} />
            <ConfirmModal isOpen={confirmModalState.isOpen} onClose={() => setConfirmModalState({ isOpen: false, onConfirm: null })} onConfirm={confirmModalState.onConfirm} title={`Delete ${resourceInfo.label}`} message={`Are you sure you want to delete this ${resourceInfo.label.toLowerCase()}?`} />

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