import React, { useState, useEffect } from 'react';
import { Content, User, ResourceType } from '../../types';
import { useApi } from '../../hooks/useApi';
import * as api from '../../services/api';
import { NotesIcon } from '../icons/ResourceTypeIcons';
import { PlusIcon, EditIcon, TrashIcon } from '../icons/AdminIcons';
import { ConfirmModal } from '../ConfirmModal';
import { NoteEditor } from './NoteEditor';
import { useToast } from '../../context/ToastContext';
import { useSession } from '../../context/SessionContext';
import { FontSizeControl } from '../FontSizeControl';
import { processContentForHTML } from '../../utils/htmlUtils';

declare global {
    interface Window {
        MathJax: any;
    }
}

interface NotesViewProps {
    lessonId: string;
    user: User;
}

const NoteCard: React.FC<{ item: Content; onEdit: (c: Content) => void; onDelete: (id: string) => void; isAdmin: boolean; }> = ({ item, onEdit, onDelete, isAdmin }) => {
    const { session } = useSession();
    // Apply dynamic font size via style (similar to Q&A page)
    const fontStyle = { fontSize: `${session.fontSize}px` };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 relative group">
            {/* Apply dynamic font size via style with proper text wrapping and hidden scrollbar */}
            <div 
                className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 break-words overflow-y-auto note-content"
                style={{
                    fontSize: `${fontStyle.fontSize}`,
                    // Allow full height usage (100%) instead of limiting to 400px
                    minHeight: 'calc(100vh - 200px)',
                    maxHeight: 'calc(100vh - 150px)',
                    // Enhanced scrollbar hiding while keeping scrolling functionality
                    scrollbarWidth: 'none', // Firefox
                    msOverflowStyle: 'none', // Internet Explorer and Edge
                    WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
                }}
                dangerouslySetInnerHTML={{ __html: processContentForHTML(item.body) }}
            />
            {/* Hide scrollbar for all browsers */}
            <style>
                {`
                .note-content {
                    /* Hide scrollbar for WebKit browsers */
                    -webkit-overflow-scrolling: touch;
                }
                
                .note-content::-webkit-scrollbar {
                    display: none !important;
                    width: 0 !important;
                    height: 0 !important;
                }
                
                .note-content::-moz-scrollbar {
                    display: none !important;
                }
                
                .note-content::-ms-scrollbar {
                    display: none !important;
                }
                
                .note-content::-o-scrollbar {
                    display: none !important;
                }
                
                /* Hide scrollbar for Firefox */
                .note-content {
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                }
                `}
            </style>
            {isAdmin && (
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-0 md:group-hover:opacity-100">
                    <button onClick={() => onEdit(item)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm" title="Edit Note"><EditIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" /></button>
                    <button onClick={() => onDelete(item._id)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm" title="Delete Note"><TrashIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" /></button>
                </div>
            )}
        </div>
    );
};

export const NotesView: React.FC<NotesViewProps> = ({ lessonId, user }) => {
    const [version, setVersion] = useState(0);
    const { data: groupedContent, isLoading } = useApi(() => api.getContentsByLessonId(lessonId, ['notes']), [lessonId, version]);
    
    const [editingNote, setEditingNote] = useState<Content | boolean | null>(null);
    const [confirmModalState, setConfirmModalState] = useState<{ isOpen: boolean; onConfirm: (() => void) | null }>({ isOpen: false, onConfirm: null });
    const { showToast } = useToast();

    const notes = groupedContent?.[0]?.docs || [];
    const resourceType: ResourceType = 'notes';
    const canEdit = user.role === 'admin' || !!user.canEdit;

    useEffect(() => {
        if (window.MathJax && !isLoading && notes.length > 0 && editingNote === null) {
            window.MathJax.typesetPromise();
        }
    }, [notes, isLoading, editingNote]);

    const handleSave = async (body: string) => {
        try {
            if (typeof editingNote === 'object' && editingNote !== null) {
                await api.updateContent(editingNote._id, { body });
            } else {
                // Generate a title from the content body
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = body;
                const textContent = tempDiv.textContent || tempDiv.innerText || '';
                const title = textContent.trim().substring(0, 50) || `Note - ${new Date().toLocaleDateString()}`;
                await api.addContent({ title, body, lessonId, type: resourceType });
            }
            setVersion(v => v + 1);
            showToast('Note saved successfully.', 'success');
        } catch (e) {
            showToast('Failed to save note.', 'error');
        }
        setEditingNote(null);
    };

    const handleDelete = (contentId: string) => {
        const confirmAction = async () => {
            try {
                await api.deleteContent(contentId);
                setVersion(v => v + 1);
                showToast('Note deleted.', 'error');
            } catch (e) {
                showToast('Failed to delete note.', 'error');
            }
            setConfirmModalState({ isOpen: false, onConfirm: null });
        };
        setConfirmModalState({ isOpen: true, onConfirm: confirmAction });
    };

    const handleCancelEdit = () => {
        setEditingNote(null);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center">
                    <NotesIcon className="w-8 h-8 mr-3 text-blue-500" />
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">Notes</h1>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Add Font Size Control (referencing Q&A page model) */}
                    <FontSizeControl />
                    
                    {canEdit && !editingNote && (
                        <button onClick={() => setEditingNote(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" title="Add New Note">
                            <PlusIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">Add New</span>
                        </button>
                    )}
                </div>
            </div>

            {editingNote ? (
                <div className="flex-1 overflow-y-auto min-h-0 pb-3">
                    <NoteEditor 
                        initialValue={typeof editingNote === 'object' && editingNote !== null ? editingNote.body : ''}
                        onSave={handleSave}
                        onCancel={handleCancelEdit}
                    />
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto min-h-0 pb-6">
                    {isLoading && <div className="text-center py-10">Loading notes...</div>}

                    {!isLoading && notes.length > 0 && (
                        <div className="space-y-[30px]">
                            {notes.map(note => <NoteCard key={note._id} item={note} onEdit={setEditingNote} onDelete={handleDelete} isAdmin={canEdit} />)}
                        </div>
                    )}
                    
                    {!isLoading && notes.length === 0 && (
                        <div className="text-center py-20 bg-white dark:bg-gray-800/50 rounded-lg">
                            <NotesIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                            <p className="mt-4 text-gray-500">No notes available for this chapter.</p>
                        </div>
                    )}
                </div>
            )}

            <ConfirmModal isOpen={confirmModalState.isOpen} onClose={() => setConfirmModalState({ isOpen: false, onConfirm: null })} onConfirm={confirmModalState.onConfirm} title="Delete Note" message="Are you sure you want to delete this note?" />
        </div>
    );
};