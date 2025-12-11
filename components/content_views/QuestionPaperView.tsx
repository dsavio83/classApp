import React, { useState, useMemo, useEffect } from 'react';
// Force re-compile
import { Content, User, QuestionPaperCategory, QuestionPaperMetadata } from '../../types';
import { useApi } from '../../hooks/useApi';
import * as api from '../../services/api';
import { QuestionPaperIcon } from '../icons/ResourceTypeIcons';
import { PlusIcon, EditIcon, TrashIcon, XIcon } from '../icons/AdminIcons';
import { ConfirmModal } from '../ConfirmModal';
import { PdfViewer } from './PdfViewer';
import { useToast } from '../../context/ToastContext';

interface QuestionPaperViewProps {
    lessonId: string;
    user: User;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const TERMS = ['First Summative', 'Second Summative', 'Annual Summative'];

// Beautiful View Count Component
const getViewCountStyle = (viewCount: number) => {
    if (viewCount === 0) {
        return 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-600 dark:text-gray-300';
    } else if (viewCount <= 5) {
        return 'bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-700 text-blue-700 dark:text-blue-300';
    } else if (viewCount <= 15) {
        return 'bg-gradient-to-r from-green-100 to-green-200 dark:from-green-800 dark:to-green-700 text-green-700 dark:text-green-300';
    } else if (viewCount <= 30) {
        return 'bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-800 dark:to-yellow-700 text-yellow-700 dark:text-yellow-300';
    } else if (viewCount <= 50) {
        return 'bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-800 dark:to-orange-700 text-orange-700 dark:text-orange-300';
    } else {
        return 'bg-gradient-to-r from-red-100 to-red-200 dark:from-red-800 dark:to-red-700 text-red-700 dark:text-red-300';
    }
};

const getViewCountText = (viewCount: number) => {
    if (viewCount === 0) return 'No views yet';
    if (viewCount === 1) return '1 view';
    if (viewCount <= 5) return `${viewCount} views`;
    if (viewCount <= 15) return `${viewCount} views • Popular`;
    if (viewCount <= 30) return `${viewCount} views • Trending`;
    if (viewCount <= 50) return `${viewCount} views • Hot`;
    return `${viewCount} views • Viral`;
};

const BeautifulViewCount: React.FC<{ viewCount: number }> = ({ viewCount }) => {
    const countStyle = getViewCountStyle(viewCount);
    const countText = getViewCountText(viewCount);

    return (
        <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium ${countStyle} shadow-sm transition-all duration-200 hover:shadow-md transform hover:scale-105`}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            <span>{countText}</span>
        </span>
    );
};

const getCardStyle = (category: string) => {
    switch (category) {
        case 'Monthly':
            return 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1';
        case 'Term Exam':
            return 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1';
        case 'Model Exam':
            return 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/30 dark:to-violet-900/30 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1';
        case 'SSLC Exam':
            return 'bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1';
        default:
            return 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 shadow-lg hover:shadow-xl transform hover:-translate-y-1';
    }
};

const getIconStyle = (category: string) => {
    switch (category) {
        case 'Monthly':
            return 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 text-green-600 dark:text-green-400 shadow-md';
        case 'Term Exam':
            return 'bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 text-blue-600 dark:text-blue-400 shadow-md';
        case 'Model Exam':
            return 'bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/50 dark:to-violet-900/50 text-purple-600 dark:text-purple-400 shadow-md';
        case 'SSLC Exam':
            return 'bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/50 dark:to-pink-900/50 text-red-600 dark:text-red-400 shadow-md';
        default:
            return 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-600 dark:text-blue-400 shadow-md';
    }
};

const AddEditModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Content, '_id' | 'lessonId' | 'type'>) => Promise<void>;
    paperToEdit: Content | null;
}> = ({ isOpen, onClose, onSave, paperToEdit }) => {
    // ... (Modal logic same)
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<QuestionPaperCategory>('Monthly');
    const [subCategory, setSubCategory] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (paperToEdit) {
                setTitle(paperToEdit.title);
                setCategory(paperToEdit.metadata?.category || 'Monthly');
                setSubCategory(paperToEdit.metadata?.subCategory || '');
                setPreviewDataUrl(paperToEdit.body); // Assumes body is a data URL for editing
            } else {
                setTitle('');
                setCategory('Monthly');
                setSubCategory('');
                setFile(null);
                setPreviewDataUrl(null);
                setError('');
            }
        }
    }, [isOpen, paperToEdit]);

    useEffect(() => {
        setSubCategory('');
    }, [category]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === "application/pdf") {
            setFile(selectedFile);
            setError('');
            const reader = new FileReader();
            reader.onloadend = () => setPreviewDataUrl(reader.result as string);
            reader.readAsDataURL(selectedFile);
        } else {
            setError("Please select a valid PDF file.");
            setFile(null);
            setPreviewDataUrl(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !previewDataUrl) {
            setError("Title and a PDF file are required.");
            return;
        }
        if (category !== 'SSLC Exam' && !subCategory.trim()) {
            setError("Please fill in the sub-category details.");
            return;
        }
        setIsSaving(true);
        setError('');
        try {
            const metadata: QuestionPaperMetadata = { category };
            if (category !== 'SSLC Exam') {
                metadata.subCategory = subCategory.trim();
            }
            await onSave({ title: title.trim(), body: previewDataUrl, metadata });
            onClose();
        } catch (err) {
            setError("Failed to save. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    // ... (Render subcategory input logic same)
    const renderSubCategoryInput = () => {
        const commonClasses = "mt-1 w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600";
        switch (category) {
            case 'Monthly':
                return <>
                    <label className="block text-sm font-medium">Month</label>
                    <select value={subCategory} onChange={e => setSubCategory(e.target.value)} required className={commonClasses}>
                        <option value="" disabled>Select Month</option>
                        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </>;
            case 'Term Exam':
                return <>
                    <label className="block text-sm font-medium">Term</label>
                    <select value={subCategory} onChange={e => setSubCategory(e.target.value)} required className={commonClasses}>
                        <option value="" disabled>Select Term</option>
                        {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </>;
            case 'Model Exam':
                return <>
                    <label className="block text-sm font-medium">Model Name</label>
                    <input type="text" value={subCategory} onChange={e => setSubCategory(e.target.value)} placeholder="e.g., Model 1" required className={commonClasses} />
                </>;
            case 'Custom':
                return <>
                    <label className="block text-sm font-medium">Custom Name</label>
                    <input type="text" value={subCategory} onChange={e => setSubCategory(e.target.value)} placeholder="e.g., Special Test Series" required className={commonClasses} />
                </>;
            case 'SSLC Exam':
                return null;
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg max-h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{paperToEdit ? 'Edit' : 'Add'} Question Paper</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Category</label>
                        <select value={category} onChange={e => setCategory(e.target.value as QuestionPaperCategory)} className="mt-1 w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600">
                            <option value="Monthly">Monthly</option>
                            <option value="Term Exam">Term Exam</option>
                            <option value="Model Exam">Model Exam</option>
                            <option value="SSLC Exam">SSLC Exam</option>
                            <option value="Custom">Custom</option>
                        </select>
                    </div>
                    {renderSubCategoryInput()}
                    <div>
                        <label className="block text-sm font-medium">PDF File</label>
                        <input type="file" onChange={handleFileChange} accept=".pdf" className="mt-1 w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/50 dark:file:text-blue-300 dark:hover:file:bg-blue-900" />
                        {previewDataUrl && !file && <p className="text-xs text-gray-500 mt-1">Current PDF is retained. Upload a new file to replace it.</p>}
                        {file && <p className="text-xs text-green-600 dark:text-green-400 mt-1">New PDF selected: {file.name}</p>}
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md" disabled={isSaving}>Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-400" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const QuestionPaperView: React.FC<QuestionPaperViewProps> = ({ lessonId, user }) => {
    const [version, setVersion] = useState(0);
    const { data: groupedContent, isLoading } = useApi(() => api.getContentsByLessonId(lessonId, ['questionPaper']), [lessonId, version]);

    const [modalState, setModalState] = useState<{ isOpen: boolean; paper: Content | null }>({ isOpen: false, paper: null });
    const [confirmModalState, setConfirmModalState] = useState<{ isOpen: boolean; onConfirm: (() => void) | null }>({ isOpen: false, onConfirm: null });
    const [fullscreenPdf, setFullscreenPdf] = useState<{ url: string; title: string } | null>(null);
    const { showToast } = useToast();

    const papers = groupedContent?.[0]?.docs || [];
    const canEdit = user.role === 'admin' || !!user.canEdit;

    const groupedPapers = useMemo(() => {
        const groups: { [key: string]: { [key: string]: Content[] } } = {};

        // Sort papers by title
        const sortedPapers = [...papers].sort((a, b) => a.title.localeCompare(b.title));

        sortedPapers.forEach(paper => {
            const meta = paper.metadata as QuestionPaperMetadata | undefined;
            const category = meta?.category || 'Uncategorized';
            const subCategory = meta?.subCategory || 'General';
            if (!groups[category]) groups[category] = {};
            if (!groups[category][subCategory]) groups[category][subCategory] = [];
            groups[category][subCategory].push(paper);
        });
        return groups;
    }, [papers]);

    const handleSave = async (data: Omit<Content, '_id' | 'lessonId' | 'type'>) => {
        try {
            if (modalState.paper) {
                await api.updateContent(modalState.paper._id, data);
            } else {
                await api.addContent({ ...data, lessonId, type: 'questionPaper' });
            }
            setVersion(v => v + 1);
            showToast('Paper saved successfully!', 'success');
        } catch (e) {
            showToast('Failed to save paper.', 'error');
        }
    };

    const handleView = async (paper: Content) => {
        if (!paper.body.startsWith('data:application/pdf')) return;

        const meta = paper.metadata as QuestionPaperMetadata | undefined;
        const metaCat = meta?.category || '';
        const metaSub = meta?.subCategory || '';
        const fullName = `${paper.title} - ${metaCat}${metaSub ? ` - ${metaSub}` : ''}`;

        setFullscreenPdf({ url: paper.body, title: fullName });

        try {
            // Optimistic update could be done here, but for now we just fire and forget or refetch
            // To keep UI responsive, we won't await this for the modal opening
            api.incrementViewCount(paper._id).catch(console.error);
            // Trigger a re-fetch to update view counts in the background
            setVersion(v => v + 1);
        } catch (e) {
            console.error("Failed to update view count", e);
        }
    };

    const handleDelete = (paperId: string) => {
        const confirmAction = async () => {
            try {
                await api.deleteContent(paperId);
                setVersion(v => v + 1);
                showToast('Paper deleted.', 'error');
            } catch (e) {
                showToast('Failed to delete paper.', 'error');
            }
            setConfirmModalState({ isOpen: false, onConfirm: null });
        };
        setConfirmModalState({ isOpen: true, onConfirm: confirmAction });
    };

    return (
        <div className="p-2 sm:p-4 lg:p-6 h-full overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <div className="flex items-center">
                    <QuestionPaperIcon className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-blue-500" />
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">Question Papers</h1>
                </div>
                
                {canEdit && (
                    <button
                        onClick={() => setModalState({ isOpen: true, paper: null })}
                        className="flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        title="Add Paper"
                    >
                        <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Add New</span>
                    </button>
                )}
            </div>

            {isLoading && <div className="text-center py-10">Loading papers...</div>}

            {!isLoading && papers.length === 0 && (
                <div className="text-center py-10 bg-white dark:bg-gray-800/50 rounded-lg">
                    <QuestionPaperIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
                    <p className="mt-3 text-sm text-gray-500">No question papers available for this chapter.</p>
                </div>
            )}

            {!isLoading && papers.length > 0 && (
                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="space-y-4">
                    {Object.entries(groupedPapers).map(([category, subCategories]) => (
                        <div key={category} className="mb-4">
                            <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-lg p-2.5 sm:p-4 mb-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                                <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
                                    <div className="w-2 sm:w-3 h-5 sm:h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                                    {category}
                                </h2>
                            </div>
                            <div className="space-y-3 sm:space-y-4">
                                {Object.entries(subCategories).map(([subCategory, paperList]) => (
                                    <div key={subCategory}>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                                            {paperList.map(paper => {
                                                const canOpen = paper.body.startsWith('data:application/pdf');
                                                const meta = paper.metadata as QuestionPaperMetadata | undefined;
                                                const metaCat = meta?.category || '';
                                                const metaSub = meta?.subCategory || '';
                                                const fullName = `${paper.title} - ${metaCat}${metaSub ? ` - ${metaSub}` : ''}`;
                                                const cardStyle = getCardStyle(metaCat);
                                                const iconStyle = getIconStyle(metaCat);

                                                return (
                                                    <div key={paper._id} className={`${cardStyle} rounded-lg p-3 sm:p-4 lg:p-6 flex justify-between items-center group border-2 hover:shadow-2xl transition-all duration-300 animate-fade-in-up`}>
                                                        <button
                                                            onClick={() => handleView(paper)}
                                                            disabled={!canOpen}
                                                            className="flex flex-row items-center gap-2 sm:gap-3 text-left flex-1 min-w-0 disabled:cursor-not-allowed disabled:opacity-60 w-full group-hover:scale-105 transition-transform duration-200"
                                                            title={canOpen ? "View Paper" : "Cannot open mock paper"}
                                                        >
                                                            <div className={`p-2 sm:p-3 ${iconStyle} rounded-full shrink-0 group-hover:rotate-12 transition-transform duration-200 shadow-lg`}>
                                                                <QuestionPaperIcon className="w-4 h-4 sm:w-6 sm:h-6" />
                                                            </div>
                                                            <div className="flex-1 min-w-0 w-full">
                                                                <h3 className="font-bold text-sm sm:text-lg text-gray-800 dark:text-white truncate w-full leading-tight">{fullName}</h3>
                                                                <div className="flex gap-2 items-center mt-1">
                                                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium hidden sm:inline">Click to view</p>
                                                                    {paper.viewCount !== undefined && (
                                                                        <BeautifulViewCount viewCount={paper.viewCount} />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </button>
                                                        {canEdit && (
                                                            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0 translate-x-1 ml-2">
                                                                <button onClick={() => setModalState({ isOpen: true, paper })} className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200" title="Edit">
                                                                    <EditIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                </button>
                                                                <button onClick={() => handleDelete(paper._id)} className="p-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200" title="Delete">
                                                                    <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
            )}

            <AddEditModal isOpen={modalState.isOpen} onClose={() => setModalState({ isOpen: false, paper: null })} onSave={handleSave} paperToEdit={modalState.paper} />
            <ConfirmModal isOpen={confirmModalState.isOpen} onClose={() => setConfirmModalState({ isOpen: false, onConfirm: null })} onConfirm={confirmModalState.onConfirm} title="Delete Paper" message="Are you sure you want to delete this question paper?" />

            {fullscreenPdf && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col animate-fade-in h-screen w-screen">
                    <div className="flex justify-between items-center p-4 bg-black/60 absolute top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-white/10">
                        <h2 className="text-white font-medium text-lg truncate px-4">{fullscreenPdf.title}</h2>
                        <button
                            onClick={() => setFullscreenPdf(null)}
                            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                            aria-label="Close fullscreen PDF viewer"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="w-full h-full pt-16 pb-4 px-4">
                        <PdfViewer url={fullscreenPdf.url} initialScale={1.2} />
                    </div>
                </div>
            )}
        </div>
    );
};