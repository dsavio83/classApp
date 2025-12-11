import React, { useState, useEffect } from 'react';
import { Content, ResourceType } from '../types';

interface ContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (contentData: { title: string; body: string }) => Promise<void>;
    contentToEdit: Content | null;
    resourceType: ResourceType;
}

export const ContentModal: React.FC<ContentModalProps> = ({ isOpen, onClose, onSave, contentToEdit, resourceType }) => {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (contentToEdit) {
            setTitle(contentToEdit.title);
            setBody(contentToEdit.body);
        } else {
            setTitle('');
            setBody('');
        }
    }, [contentToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim() && body.trim() && !isSaving) {
            setIsSaving(true);
            await onSave({ title: title.trim(), body: body.trim() });
            setIsSaving(false);
        }
    };
    
    const resourceName = resourceType.charAt(0).toUpperCase() + resourceType.slice(1);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">{contentToEdit ? `Edit ${resourceName}` : `Add New ${resourceName}`}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Title"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        required
                        autoFocus
                    />
                    <textarea
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        placeholder="Content / URL / Description"
                        rows={10}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        required
                    />
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 disabled:opacity-50" disabled={isSaving}>
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-wait" disabled={isSaving}>
                            {isSaving ? 'Saving...' : (contentToEdit ? 'Save Changes' : `Create ${resourceName}`)}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};