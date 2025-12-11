import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Content, User, ResourceType, QAMetadata, QuestionType, CognitiveProcess } from '../../types';
import { useApi } from '../../hooks/useApi';
import * as api from '../../services/api';
import { QAIcon } from '../icons/ResourceTypeIcons';
import { PlusIcon, EditIcon, TrashIcon, ChevronRightIcon } from '../icons/AdminIcons';
import { ConfirmModal } from '../ConfirmModal';
import { useSession } from '../../context/SessionContext';
import { FontSizeControl } from '../FontSizeControl'; // Import the new control
import { 
    containsHTML, 
    decodeHTMLEntities, 
    isEncodedHTML, 
    enhanceHTMLContent, 
    safeHTMLRender, 
    processContentForHTML 
} from '../../utils/htmlUtils';

declare const Quill: any;

interface QAViewProps {
    lessonId: string;
    user: User;
}

// ... (Helpers: COGNITIVE_PROCESSES, getMarksColor, getQuestionTypeColor remain same)
const COGNITIVE_PROCESSES: { [key in CognitiveProcess]: { label: string, color: string } } = {
    'CP1': { label: 'Conceptual Clarity', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    'CP2': { label: 'Application Skill', color: 'bg-green-100 text-green-800 border-green-200' },
    'CP3': { label: 'Computational Thinking', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    'CP4': { label: 'Analytical Thinking', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    'CP5': { label: 'Critical Thinking', color: 'bg-red-100 text-red-800 border-red-200' },
    'CP6': { label: 'Creative Thinking', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    'CP7': { label: 'Values/Attitudes', color: 'bg-pink-100 text-pink-800 border-pink-200' },
};

const getMarksColor = (marks: number): string => {
    switch (marks) {
        case 2: return 'bg-teal-100 text-teal-800 border-teal-200';
        case 3: return 'bg-sky-100 text-sky-800 border-sky-200';
        case 5: return 'bg-orange-100 text-orange-800 border-orange-200';
        case 6: return 'bg-rose-100 text-rose-800 border-rose-200';
        default: return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
};

const getQuestionTypeColor = (type: QuestionType): string => {
    switch (type) {
        case 'Basic': return 'bg-emerald-100 text-emerald-800 border-emerald-200'; 
        case 'Average': return 'bg-amber-100 text-amber-800 border-amber-200'; 
        case 'Profound': return 'bg-violet-100 text-violet-800 border-violet-200'; 
        default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
};

// ... (QAEditorModal remains same)
interface QAEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { title: string; body: string; metadata: QAMetadata }) => Promise<void>;
    contentToEdit: Content | null;
}

const QAEditorModal: React.FC<QAEditorModalProps> = ({ isOpen, onClose, onSave, contentToEdit }) => {
    const [activeTab, setActiveTab] = useState<'question' | 'answer'>('question');
    const [questionHtml, setQuestionHtml] = useState('');
    const [answerHtml, setAnswerHtml] = useState('');
    const [marks, setMarks] = useState<number>(2);
    const [qType, setQType] = useState<QuestionType>('Basic');
    const [cogProcess, setCogProcess] = useState<CognitiveProcess>('CP1');
    const [isSaving, setIsSaving] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<any>(null);

    // Initialize Quill editor and load content
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const initializeEditor = () => {
            // Reset state for new session
            setIsInitialized(false);
            setActiveTab('question');
            
            // Load content from contentToEdit or reset for new content
            const questionContent = contentToEdit ? contentToEdit.title : '';
            const answerContent = contentToEdit ? contentToEdit.body : '';
            
            console.log('[QAEditor] Loading content for edit:', contentToEdit ? 'existing' : 'new');
            console.log('[QAEditor] Question content:', questionContent.substring(0, 100) + (questionContent.length > 100 ? '...' : ''));
            console.log('[QAEditor] Answer content:', answerContent.substring(0, 100) + (answerContent.length > 100 ? '...' : ''));
            
            setQuestionHtml(questionContent);
            setAnswerHtml(answerContent);
            
            // Load metadata
            const meta = contentToEdit?.metadata as QAMetadata | undefined;
            setMarks(meta?.marks || 2);
            setQType(meta?.questionType || 'Basic');
            setCogProcess(meta?.cognitiveProcess || 'CP1');
            
            // Initialize Quill editor
            if (editorContainerRef.current && !quillRef.current) {
                console.log('[QAEditor] Initializing Quill editor');
                
                const quill = new Quill(editorContainerRef.current, { 
                    theme: 'snow', 
                    modules: { 
                        toolbar: [ 
                            ['bold', 'italic', 'underline', 'strike'], 
                            ['blockquote', 'code-block'], 
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }], 
                            [{ 'script': 'sub'}, { 'script': 'super' }], 
                            [{ 'color': [] }, { 'background': [] }], 
                            ['image', 'video', 'formula'], 
                            ['clean'] 
                        ] 
                    }, 
                    placeholder: 'Enter content...' 
                });
                
                // Load initial content based on active tab
                const initialContent = activeTab === 'question' ? questionContent : answerContent;
                console.log('[QAEditor] Setting initial content for', activeTab, ':', initialContent.substring(0, 100) + '...');
                quill.root.innerHTML = initialContent;
                
                quillRef.current = quill;
                setIsInitialized(true);
                
                console.log('[QAEditor] Editor initialized successfully');
            }
        };

        // Small delay to ensure DOM is ready
        const timer = setTimeout(initializeEditor, 100);
        return () => clearTimeout(timer);
    }, [isOpen, contentToEdit]);

    // Cleanup when modal closes
    useEffect(() => {
        return () => {
            if (!isOpen) {
                console.log('[QAEditor] Cleaning up editor');
                quillRef.current = null;
                setIsInitialized(false);
            }
        };
    }, [isOpen]);

    // Load content when tab changes
    useEffect(() => {
        if (quillRef.current && isInitialized && isOpen) {
            const contentToLoad = activeTab === 'question' ? questionHtml : answerHtml;
            const currentContent = quillRef.current.root.innerHTML;
            
            console.log('[QAEditor] Tab changed to', activeTab);
            console.log('[QAEditor] Content to load:', contentToLoad.substring(0, 100) + '...');
            console.log('[QAEditor] Current content:', currentContent.substring(0, 100) + '...');
            
            if (currentContent !== contentToLoad) {
                console.log('[QAEditor] Loading content into Quill editor');
                quillRef.current.root.innerHTML = contentToLoad;
            }
        }
    }, [activeTab, isInitialized, questionHtml, answerHtml, isOpen]);

    const handleTabSwitch = (newTab: 'question' | 'answer') => {
        if (newTab === activeTab || !quillRef.current || !isInitialized) return;
        
        console.log('[QAEditor] Switching from', activeTab, 'to', newTab);
        
        // Save current tab content before switching
        const currentContent = quillRef.current.root.innerHTML;
        console.log('[QAEditor] Saving current content before switch:', currentContent.substring(0, 100) + '...');
        
        if (activeTab === 'question') {
            setQuestionHtml(currentContent);
            console.log('[QAEditor] Saved question content');
        } else {
            setAnswerHtml(currentContent);
            console.log('[QAEditor] Saved answer content');
        }
        
        // Switch to new tab - the useEffect will handle loading the content
        setActiveTab(newTab);
        console.log('[QAEditor] Tab switched to:', newTab);
    };

    const handleSaveClick = async () => {
        if (isSaving) return;
        
        // Get current content from editor
        let finalQuestion = questionHtml;
        let finalAnswer = answerHtml;
        
        if (quillRef.current && isInitialized) {
            const currentContent = quillRef.current.root.innerHTML;
            console.log('[QAEditor] Saving current editor content:', currentContent.substring(0, 100) + '...');
            
            if (activeTab === 'question') {
                finalQuestion = currentContent;
            } else {
                finalAnswer = currentContent;
            }
        }
        
        // Validate required fields
        if (!finalQuestion.trim() || !finalAnswer.trim()) { 
            alert("Both Question and Answer must have content."); 
            return; 
        }
        
        console.log('[QAEditor] Saving Q&A with question length:', finalQuestion.length, 'answer length:', finalAnswer.length);
        
        setIsSaving(true);
        try {
            const metadata: QAMetadata = { marks, questionType: qType, cognitiveProcess: cogProcess };
            await onSave({ title: finalQuestion, body: finalAnswer, metadata });
            
            console.log('[QAEditor] Q&A saved successfully');
            
            // Reset form
            handleClose();
            
        } catch (error) {
            console.error('Error saving Q&A:', error);
            alert('Error saving Q&A. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleClose = () => { 
        console.log('[QAEditor] Closing modal and resetting form');
        
        // Reset all state
        setQuestionHtml('');
        setAnswerHtml('');
        setMarks(2);
        setQType('Basic');
        setCogProcess('CP1');
        setActiveTab('question');
        setIsInitialized(false);
        
        // Clear Quill editor
        if (quillRef.current) {
            quillRef.current.root.innerHTML = '';
        }
        
        // Reset editor reference
        quillRef.current = null;
        
        onClose(); 
    };
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">{contentToEdit ? 'Edit Q&A' : 'Add New Q&A'}</h2>
                    <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><span className="text-2xl">&times;</span></button>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-gray-200 dark:border-gray-700">
                    <div><label className="block text-xs font-medium text-gray-500 uppercase mb-1">Marks</label><select value={marks} onChange={(e) => setMarks(Number(e.target.value))} className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"><option value={2}>2 Marks</option><option value={3}>3 Marks</option><option value={5}>5 Marks</option><option value={6}>6 Marks</option></select></div>
                    <div><label className="block text-xs font-medium text-gray-500 uppercase mb-1">Question Type</label><select value={qType} onChange={(e) => setQType(e.target.value as QuestionType)} className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"><option value="Basic">Basic</option><option value="Average">Average</option><option value="Profound">Profound</option></select></div>
                    <div><label className="block text-xs font-medium text-gray-500 uppercase mb-1">Cognitive Process</label><select value={cogProcess} onChange={(e) => setCogProcess(e.target.value as CognitiveProcess)} className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white">{Object.entries(COGNITIVE_PROCESSES).map(([key, value]) => (<option key={key} value={key}>{key} - {value.label}</option>))}</select></div>
                </div>
                <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <button className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${activeTab === 'question' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-t-2 border-blue-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`} onClick={() => handleTabSwitch('question')}>Question</button>
                    <button className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${activeTab === 'answer' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-t-2 border-blue-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`} onClick={() => handleTabSwitch('answer')}>Answer</button>
                </div>
                <div className="flex-1 flex flex-col p-4 overflow-hidden bg-white dark:bg-gray-800">
                    <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 flex-1 flex flex-col overflow-hidden text-gray-900 dark:text-gray-100">
                        <div ref={editorContainerRef} className="flex-1 overflow-y-auto tamil-text" style={{ minHeight: '200px', fontFamily: "'Noto Sans Tamil', 'Kailasa', 'Latha', sans-serif" }}></div>
                    </div>
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
                    <button onClick={handleClose} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600" disabled={isSaving}>Cancel</button>
                    <button onClick={handleSaveClick} className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Q&A'}</button>
                </div>
            </div>
        </div>
    );
};

const QACard: React.FC<{ 
    item: Content; 
    isOpen: boolean;
    onToggle: () => void;
    onEdit: (c: Content) => void; 
    onDelete: (id: string) => void; 
    isAdmin: boolean; 
}> = ({ item, isOpen, onToggle, onEdit, onDelete, isAdmin }) => {
    
    const { session } = useSession();
    const meta = item.metadata as QAMetadata | undefined;
    const cp = meta?.cognitiveProcess ? COGNITIVE_PROCESSES[meta.cognitiveProcess] : null;

    // Use inline style for exact pixel font size
    const fontStyle = { fontSize: `${session.fontSize}px` };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-6 border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
            <div onClick={onToggle} className="w-full text-left p-5 flex flex-col group focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700/50 transition-all duration-200 cursor-pointer">
                <div className="flex flex-wrap gap-2 mb-2">
                    {meta?.marks && <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getMarksColor(meta.marks)}`}>{meta.marks} Marks</span>}
                    {meta?.questionType && <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getQuestionTypeColor(meta.questionType)}`}>{meta.questionType}</span>}
                    {cp && <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cp.color}`}>{cp.label}</span>}
                </div>

                <div className="flex justify-between items-start w-full">
                    <div className="flex-1 pr-4">
                         {/* Apply dynamic font size via style with Tamil font support, HTML enhancement, and Q&A header enhancement */}
                         <div className="prose dark:prose-invert max-w-none font-medium text-gray-800 dark:text-white qa-content tamil-text" style={fontStyle} dangerouslySetInnerHTML={{ __html: processContentForHTML(item.title) }} />
                    </div>
                    <div className="flex items-center shrink-0 mt-1">
                        {isAdmin && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-4" onClick={e => e.stopPropagation()}>
                                <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500" title="Edit Q&A">
                                    <EditIcon className="w-4 h-4" />
                                    <span className="hidden sm:inline ml-1">Edit</span>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onDelete(item._id); }} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-red-600" title="Delete Q&A">
                                    <TrashIcon className="w-4 h-4" />
                                    <span className="hidden sm:inline ml-1">Delete</span>
                                </button>
                            </div>
                        )}
                        <div className={`p-1 rounded-full bg-gray-100 dark:bg-gray-700 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                             <ChevronRightIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                    </div>
                </div>
            </div>
            {isOpen && (
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 dark:from-gray-800/50 dark:to-gray-700/50 animate-fade-in">
                    {/* Apply dynamic font size via style with Tamil font support, HTML enhancement, and Q&A header enhancement */}
                    <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 qa-content tamil-text" style={fontStyle} dangerouslySetInnerHTML={{ __html: processContentForHTML(item.body) }} />
                </div>
            )}
        </div>
    );
};

export const QAView: React.FC<QAViewProps> = ({ lessonId, user }) => {
    const [version, setVersion] = useState(0);
    const { data: groupedContent, isLoading } = useApi(() => api.getContentsByLessonId(lessonId, ['qa']), [lessonId, version]);
    const [modalState, setModalState] = useState<{ isOpen: boolean; content: Content | null }>({ isOpen: false, content: null });
    const [confirmModalState, setConfirmModalState] = useState<{ isOpen: boolean; onConfirm: (() => void) | null }>({ isOpen: false, onConfirm: null });
    const [openCardId, setOpenCardId] = useState<string | null>(null);
    
    // Removed local font logic, now using FontSizeControl component via SessionContext indirectly
    // Actually, the QACard consumes the context directly, so we just need to place the control in the header.

    const qaItems = groupedContent?.[0]?.docs || [];
    const resourceType: ResourceType = 'qa';
    const canEdit = user.role === 'admin' || !!user.canEdit;

    const handleSave = async (contentData: { title: string; body: string; metadata: QAMetadata }) => {
        if (modalState.content) {
            await api.updateContent(modalState.content._id, contentData);
        } else {
            await api.addContent({ ...contentData, lessonId, type: resourceType });
        }
        setVersion(v => v + 1);
        setModalState({ isOpen: false, content: null });
    };

    const handleDelete = (contentId: string) => {
        const confirmAction = async () => {
            await api.deleteContent(contentId);
            setVersion(v => v + 1);
            setConfirmModalState({ isOpen: false, onConfirm: null });
        };
        setConfirmModalState({ isOpen: true, onConfirm: confirmAction });
    };

    const handleToggleCard = (id: string) => {
        setOpenCardId(prev => prev === id ? null : id);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center">
                    <QAIcon className="w-8 h-8 mr-3 text-blue-500" />
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">Q&A</h1>
                </div>
                
                <div className="flex items-center gap-2">
                     {/* Replaced manual buttons with the reusable component */}
                     <FontSizeControl />

                    {canEdit && (
                        <button onClick={() => setModalState({ isOpen: true, content: null })} className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" title="Add New Q&A">
                            <PlusIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">Add New</span>
                        </button>
                    )}
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-0 pb-8">
                {isLoading && <div className="text-center py-12">Loading Q&A...</div>}

                {!isLoading && qaItems.length > 0 && (
                    <div className="space-y-6">
                        {qaItems.map(item => (
                            <QACard 
                                key={item._id} 
                                item={item} 
                                isOpen={openCardId === item._id}
                                onToggle={() => handleToggleCard(item._id)}
                                onEdit={(c) => setModalState({isOpen: true, content: c})} 
                                onDelete={handleDelete} 
                                isAdmin={canEdit} 
                            />
                        ))}
                    </div>
                )}
                
                {!isLoading && qaItems.length === 0 && (
                    <div className="text-center py-20 bg-white dark:bg-gray-800/50 rounded-lg">
                        <QAIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                        <p className="mt-4 text-gray-500">No Q&A available for this chapter.</p>
                    </div>
                )}
            </div>

            <QAEditorModal isOpen={modalState.isOpen} onClose={() => setModalState({ isOpen: false, content: null })} onSave={handleSave} contentToEdit={modalState.content} />
            <ConfirmModal isOpen={confirmModalState.isOpen} onClose={() => setConfirmModalState({ isOpen: false, onConfirm: null })} onConfirm={confirmModalState.onConfirm} title="Delete Q&A" message="Are you sure you want to delete this Q&A?" />
        </div>
    );
};