import React, { useState, useEffect } from 'react';
import { Content, User } from '../../types';
import { useApi } from '../../hooks/useApi';
import * as api from '../../services/api';
import { AudioIcon } from '../icons/ResourceTypeIcons';
import { TrashIcon, UploadCloudIcon, PlusIcon } from '../icons/AdminIcons';
import { ConfirmModal } from '../ConfirmModal';
import { useToast } from '../../context/ToastContext';

interface AudioViewProps {
    lessonId: string;
    user: User;
}

const SavedAudioViewer: React.FC<{ content: Content; onRemove: () => void; isAdmin: boolean }> = ({ content, onRemove, isAdmin }) => {
    const [audioError, setAudioError] = useState<string | null>(null);
    const [audioLoading, setAudioLoading] = useState(true);
    const [audioSrc, setAudioSrc] = useState<string>('');

    // Enhanced audio source detection with comprehensive debugging
    const getAudioSrc = () => {
        console.log('[AudioView] Getting audio source for content:', {
            id: content._id,
            type: content.type,
            title: content.title,
            hasFilePath: !!content.filePath,
            filePath: content.filePath,
            hasBody: !!content.body,
            bodyLength: content.body?.length || 0,
            bodyPreview: content.body?.substring(0, 100) + (content.body?.length > 100 ? '...' : ''),
            bodyStartsWith: content.body?.substring(0, 50)
        });

        // Priority 1: Local file upload with valid filePath (HIGHEST PRIORITY)
        if (content.filePath && content.filePath.trim() !== '') {
            const fileSrc = `/api/content/${content._id}/file`;
            console.log('[AudioView] Using uploaded file:', fileSrc);
            return fileSrc;
        }
        
        // Priority 2: External URL in body (must be valid URL and not JSON)
        if (content.body && content.body.trim() !== '') {
            // Check if it's a valid URL
            if (content.body.startsWith('http://') || content.body.startsWith('https://')) {
                console.log('[AudioView] Using external URL:', content.body);
                return content.body;
            }
            
            // Check if it's base64 audio data
            if (content.body.startsWith('data:audio/')) {
                console.log('[AudioView] Using base64 audio data');
                return content.body;
            }
            
            // If body contains JSON metadata (common issue), don't use it as source
            try {
                const parsed = JSON.parse(content.body);
                if (parsed && typeof parsed === 'object') {
                    console.log('[AudioView] Body contains JSON metadata, not using as audio source:', parsed);
                    return '';
                }
            } catch (e) {
                // Not JSON, could be a plain text URL or other content
                console.log('[AudioView] Body is not JSON, checking if it might be a direct URL');
            }
        }
        
        // Priority 3: Base64 audio data
        if (content.body && content.body.startsWith('data:audio/')) {
            console.log('[AudioView] Using base64 audio data');
            return content.body;
        }
        
        // No valid source found
        console.warn('[AudioView] No valid audio source found for content:', content._id);
        return '';
    };

    // Update audio source when content changes
    useEffect(() => {
        const src = getAudioSrc();
        setAudioSrc(src);
        setAudioLoading(src ? true : false);
        setAudioError(null);
    }, [content]);

    const handleAudioLoad = () => {
        console.log('[AudioView] Audio loading started');
        setAudioLoading(true);
        setAudioError(null);
    };

    const handleAudioCanPlay = () => {
        console.log('[AudioView] Audio can play');
        setAudioLoading(false);
        setAudioError(null);
    };

    const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
        const error = e.currentTarget.error;
        const audioElement = e.currentTarget;
        let errorMessage = 'Unknown audio error';
        
        console.error('[AudioView] Audio playback error details:', {
            error: error,
            src: audioSrc,
            currentSrc: audioElement.currentSrc,
            networkState: audioElement.networkState,
            readyState: audioElement.readyState,
            buffered: audioElement.buffered,
            duration: audioElement.duration,
            errorCode: error?.code,
            errorMessage: error?.message
        });
        
        if (error) {
            switch (error.code) {
                case MediaError.MEDIA_ERR_ABORTED:
                    errorMessage = 'Audio loading was aborted';
                    break;
                case MediaError.MEDIA_ERR_NETWORK:
                    errorMessage = 'Network error while loading audio. Please check your internet connection.';
                    break;
                case MediaError.MEDIA_ERR_DECODE:
                    errorMessage = 'Audio file is corrupted or unsupported format. Please try converting to MP3 or WAV.';
                    break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    errorMessage = 'Audio format not supported or file not found. Supported formats: MP3, WAV, M4A, OGG, AAC, FLAC.';
                    break;
                default:
                    errorMessage = `Audio error: ${error.message}`;
            }
        }
        
        // Additional debugging for specific issues
        if (audioSrc.includes('/api/content/') && !audioSrc.endsWith('/file')) {
            errorMessage += ' (Invalid API endpoint format)';
        }
        
        console.error('[AudioView] Final error message:', errorMessage);
        
        setAudioLoading(false);
        setAudioError(errorMessage);
    };



    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 relative w-full">
            {isAdmin && (
                <div className="absolute top-4 right-4 z-10">
                    <button onClick={onRemove} className="p-2 rounded-full bg-white/50 dark:bg-black/50 hover:bg-white/80 dark:hover:bg-black/80 backdrop-blur-sm shadow-md" title="Remove Audio">
                        <TrashIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>
            )}
            <h2 className="text-xl font-semibold mb-4 pr-12 truncate">{content.title}</h2>
            
            <div className="w-full">
                {/* Loading state */}
                {audioLoading && (
                    <div className="flex items-center justify-center py-4">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Loading audio...</span>
                    </div>
                )}
                
                {/* Audio player with enhanced error handling */}
                {audioSrc && (
                    <audio 
                        controls 
                        className="w-full" 
                        src={audioSrc}
                        onLoadStart={handleAudioLoad}
                        onCanPlay={handleAudioCanPlay}
                        onError={handleAudioError}
                        style={{ display: audioLoading ? 'none' : 'block' }}
                    >
                        Your browser does not support the audio element.
                    </audio>
                )}
                
                {/* Error state */}
                {audioError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Audio Playback Error</h3>
                                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                    <p>{audioError}</p>
                                    <p className="mt-1 text-xs">
                                        <strong>Debug Info:</strong> Source: {audioSrc || 'None'} | File Path: {content.filePath || 'None'}
                                    </p>
                                </div>
                                <div className="mt-3">
                                    <button
                                        onClick={() => {
                                            setAudioError(null);
                                            setAudioLoading(true);
                                            const src = getAudioSrc();
                                            setAudioSrc(src);
                                        }}
                                        className="text-xs bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-700"
                                    >
                                        Retry
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* No source state */}
                {!audioSrc && !audioError && !audioLoading && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">No Audio Source</h3>
                                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                                    <p>No valid audio source found for this content.</p>
                                    <p className="mt-1 text-xs">
                                        <strong>Content Info:</strong> ID: {content._id} | Type: {content.type} | File Path: {content.filePath || 'None'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const AddAudioForm: React.FC<{ lessonId: string; onAdd: () => void; onCancel: () => void; }> = ({ lessonId, onAdd, onCancel }) => {
    const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
    const [title, setTitle] = useState('Loading title...');
    const [folderPath, setFolderPath] = useState('');
    const [fileName, setFileName] = useState(''); // Separate state for filename
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
    const [url, setUrl] = useState('');
    const { showToast } = useToast();

    // Helper function to check for existing audio content and generate unique title
    const generateUniqueTitle = async (baseTitle: string): Promise<{ displayTitle: string; fileName: string }> => {
        try {
            console.log('[AUDIO DEBUG] generateUniqueTitle called with:', { baseTitle, lessonId });
            
            // Get existing audio content for this lesson
            const existingAudios = await api.getContentsByLessonId(lessonId, ['audio']);
            const audioContents = existingAudios?.[0]?.docs || [];
            
            console.log('[AUDIO DEBUG] Existing audios found:', audioContents.length);
            
            // Extract existing titles (without numbering)
            const existingTitles = audioContents.map((content: Content) => {
                const title = content.title;
                // Remove numbering patterns like " (2)", " (3)", etc. from existing titles
                return title.replace(/\s*\(\d+\)\s*$/, '').trim();
            });

            console.log('[AUDIO DEBUG] Existing titles:', existingTitles);

            // Check if baseTitle already exists
            if (!existingTitles.includes(baseTitle)) {
                console.log('[AUDIO DEBUG] No duplicate found, using baseTitle as both display and filename');
                return {
                    displayTitle: baseTitle,
                    fileName: baseTitle // Use base title as filename without numbering
                };
            }

            // Find the next available number
            let counter = 2;
            let uniqueTitle = `${baseTitle} (${counter})`;
            
            while (existingTitles.includes(uniqueTitle)) {
                counter++;
                uniqueTitle = `${baseTitle} (${counter})`;
            }

            console.log('[AUDIO DEBUG] Duplicate found, using:', { displayTitle: uniqueTitle, fileName: baseTitle });
            
            return {
                displayTitle: uniqueTitle,
                fileName: baseTitle // Always use base title as filename, no numbering in filename
            };
        } catch (error) {
            console.error('[AUDIO DEBUG] Error generating unique title:', error);
            return {
                displayTitle: baseTitle,
                fileName: baseTitle
            };
        }
    };

    // Optimized Path and Title Logic - Fast loading with minimal API calls
    useEffect(() => {
        const fetchTitleAndPath = async () => {
            try {
                console.log('=== FAST AUDIO PATH GENERATION START ===');

                // Strategy 1: Try breadcrumbs first (fastest for lessons)
                const breadcrumbs = await api.getBreadcrumbs(lessonId);
                if (breadcrumbs && breadcrumbs.trim()) {
                    const parts = breadcrumbs.split(' > ').filter(part => part.trim());
                    if (parts.length >= 2) {
                        const baseFileName = parts[parts.length - 1];
                        const hierarchyPath = parts.join('/');
                        
                        // Generate unique title and clean filename
                        const { displayTitle, fileName } = await generateUniqueTitle(baseFileName);
                        const fullVirtualPath = `${hierarchyPath}/Audio/${fileName}.mp3`;

                        console.log('Fast audio path from breadcrumbs:', fullVirtualPath);
                        setTitle(displayTitle);
                        setFileName(fileName);
                        setFolderPath(fullVirtualPath);
                        return;
                    }
                }

                console.log('Breadcrumbs failed, trying fast search...');

                // Strategy 2: Fast identification with minimal calls
                let foundLevel = false;
                let breadcrumbParts: string[] = [];
                let baseFileName = 'New Audio';

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
                            baseFileName = unit.name;
                            foundLevel = true;
                            break;
                        }

                        // Check subUnits
                        for (const unitItem of units) {
                            const subUnits = await api.getSubUnitsByUnitId(unitItem._id);

                            const subUnit = subUnits.find(su => su._id === lessonId);
                            if (subUnit) {
                                breadcrumbParts = [classItem.name, subject.name, unitItem.name, subUnit.name];
                                baseFileName = subUnit.name;
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
                                        baseFileName = lesson.name;
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

                // Generate final path with unique title
                if (foundLevel && breadcrumbParts.length > 0) {
                    const hierarchyPath = breadcrumbParts.join('/');
                    
                    // Generate unique title and clean filename
                    const { displayTitle, fileName } = await generateUniqueTitle(baseFileName);
                    const fullVirtualPath = `${hierarchyPath}/Audio/${fileName}.mp3`;

                    console.log('Fast audio path from search:', fullVirtualPath);
                    setTitle(displayTitle);
                    setFileName(fileName);
                    setFolderPath(fullVirtualPath);
                } else {
                    // Quick fallback with unique title
                    console.log('Quick audio fallback for:', lessonId);
                    const baseFallbackTitle = `Audio_${lessonId.slice(-4)}`;
                    const { displayTitle, fileName } = await generateUniqueTitle(baseFallbackTitle);
                    const fallbackPath = `Class/Audio/${fileName}.mp3`;

                    setTitle(displayTitle);
                    setFileName(fileName);
                    setFolderPath(fallbackPath);
                }

            } catch (e) {
                console.error('Fast audio path generation error:', e);
                const fallbackTitle = 'New Audio';
                setTitle(fallbackTitle);
                setFileName(fallbackTitle);
                setFolderPath(`Default/Audio/${fallbackTitle}.mp3`);
            }
        };

        if (lessonId) {
            // No timeout delay for faster response
            fetchTitleAndPath();
        } else {
            setTitle('Select a lesson/unit first');
            setFileName('Audio');
            setFolderPath('Audio/Pending Selection');
        }
    }, [lessonId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type.startsWith('audio/')) {
            setFile(selectedFile);
            setError(null);
            const reader = new FileReader();
            reader.onloadend = () => setPreviewDataUrl(reader.result as string);
            reader.readAsDataURL(selectedFile);
        } else {
            setError('Please select a valid audio file.');
            setFile(null);
            setPreviewDataUrl(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving || !title.trim()) { setError("Please provide a title."); return; }
        
        setIsSaving(true);
        setError(null);
        try {
            if (activeTab === 'upload') {
                if (!file) { setError("Please select a file to upload."); return; }
                
                // Use FormData for proper file upload - same as VideoView
                const formData = new FormData();
                formData.append('file', file);
                formData.append('lessonId', lessonId);
                formData.append('type', 'audio');
                formData.append('title', title.trim());
                formData.append('customFileName', fileName || title.trim()); // Pass the desired filename
                
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
                }
                
                const result = await response.json();
                console.log('Audio uploaded successfully:', result);
            } else {
                // Handle URL-based audio
                if (!url.trim().startsWith('http')) { setError("Please enter a valid URL."); return; }
                
                await api.addContent({ 
                    title: title.trim(), 
                    body: url, 
                    lessonId, 
                    type: 'audio',
                    metadata: { 
                        category: 'External', 
                        subCategory: 'External Link',
                        audioUrl: url
                    } as any 
                });
            }
            
            showToast('Audio added successfully', 'success');
            onAdd();
        } catch (err) { 
            console.error('Audio upload error:', err);
            setError(err instanceof Error ? err.message : "Failed to save audio. Please try again."); 
            showToast('Failed to save audio', 'error');
        } finally { 
            setIsSaving(false); 
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto bg-white dark:bg-gray-800/50 p-8 rounded-lg shadow-md mt-6">
            <h3 className="text-lg font-semibold text-center mb-6 text-gray-800 dark:text-white">Add New Audio</h3>
            <div className="mb-6 flex border-b border-gray-200 dark:border-gray-700">
                <button onClick={() => setActiveTab('upload')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'upload' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Upload File</button>
                <button onClick={() => setActiveTab('url')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'url' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Add from URL</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                 <div>
                    <label htmlFor="audioTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Audio Title</label>
                    <input 
                        id="audioTitle" 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        required 
                        className="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                    />
                     <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono truncate" title={folderPath}>
                        Path: {folderPath}
                    </p>
                </div>
                {activeTab === 'upload' && (
                    <div>
                        <label htmlFor="audioFile" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Audio File</label>
                        <div className="mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md"><div className="space-y-1 text-center"><UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400"/><div className="flex text-sm text-gray-600 dark:text-gray-400"><label htmlFor="audioFile" className="relative cursor-pointer bg-transparent rounded-md font-medium text-blue-600 hover:text-blue-500"><span>{file ? 'Change file' : 'Upload an audio file'}</span><input id="audioFile" name="audioFile" type="file" className="sr-only" onChange={handleFileChange} accept="audio/*,.m4a,.mp3,.wav,.ogg,.aac,.flac,.opus,.webm,.3gp,.3ga,.wma,.aiff,.au,.gsm,.ra,.rm" /></label></div><p className="text-xs text-gray-500 dark:text-gray-500">{file ? file.name : 'MP3, WAV, M4A, OGG, AAC, FLAC, etc.'}</p></div></div>
                    </div>
                )}
                {activeTab === 'url' && (
                    <div>
                        <label htmlFor="audioUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Audio URL</label>
                        <input id="audioUrl" type="url" value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="https://example.com/audio.mp3" className="mt-1 w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"/>
                    </div>
                )}
                {previewDataUrl && activeTab === 'upload' && (
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preview</label>
                        <audio controls src={previewDataUrl} className="w-full">Your browser does not support the audio element.</audio>
                     </div>
                )}
                {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
                <div className="flex gap-4">
                    <button type="button" onClick={onCancel} className="flex items-center items-center justify-center p-2 w-10 h-10 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors sm:w-full sm:px-4 sm:h-auto sm:justify-start">
                        <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="hidden sm:inline">Cancel</span>
                    </button>
                    <button type="submit" disabled={isSaving} className="flex items-center justify-center p-2 w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors sm:w-full sm:px-4 sm:h-auto sm:justify-start">
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin sm:mr-2" />
                        ) : (
                            <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                        <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save Audio'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export const AudioView: React.FC<AudioViewProps> = ({ lessonId, user }) => {
    const [version, setVersion] = useState(0);
    const { data: groupedContent, isLoading } = useApi(() => api.getContentsByLessonId(lessonId, ['audio']), [lessonId, version]);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; onConfirm: (() => void) | null }>({ isOpen: false, onConfirm: null });
    const [showAddForm, setShowAddForm] = useState(false);
    const { showToast } = useToast();

    const audioContents = groupedContent?.[0]?.docs || [];
    const canEdit = user.role === 'admin' || !!user.canEdit;

    const handleDelete = (contentId: string) => {
        const action = async () => {
            try {
                await api.deleteContent(contentId);
                setVersion(v => v + 1);
                showToast('Audio deleted successfully', 'success');
            } catch (e) {
                showToast('Failed to delete audio', 'error');
            }
            setConfirmModal({ isOpen: false, onConfirm: null });
        };
        setConfirmModal({ isOpen: true, onConfirm: action });
    };

    const handleAddSuccess = () => {
        setVersion(v => v + 1);
        setShowAddForm(false);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center">
                    <AudioIcon className="w-8 h-8 mr-3 text-blue-500" />
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">Audio</h1>
                </div>
                {canEdit && !showAddForm && (
                    <button onClick={() => setShowAddForm(true)} className="flex items-center justify-center p-2.5 w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors sm:px-4 sm:w-auto sm:h-auto" title="Add New Audio">
                        <PlusIcon className="w-5 h-5" />
                        <span className="hidden sm:inline sm:ml-2">Add New</span>
                    </button>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-0">
                {isLoading && <div className="text-center py-10">Loading audio...</div>}
                
                {!isLoading && showAddForm && (
                    <AddAudioForm lessonId={lessonId} onAdd={handleAddSuccess} onCancel={() => setShowAddForm(false)} />
                )}

                {!isLoading && !showAddForm && audioContents.length > 0 && (
                     <div className="flex flex-col gap-6 pb-6 w-full">
                        {audioContents.map(audio => (
                            <SavedAudioViewer key={audio._id} content={audio} onRemove={() => handleDelete(audio._id)} isAdmin={canEdit} />
                        ))}
                    </div>
                )}

                {!isLoading && !showAddForm && audioContents.length === 0 && (
                    <div className="text-center py-20 bg-white dark:bg-gray-800/50 rounded-lg">
                        <AudioIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                        <p className="mt-4 text-gray-500">
                            No audio available for this chapter.
                            {canEdit && " Click 'Add New Audio' to get started."}
                        </p>
                    </div>
                )}
            </div>
            
            <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, onConfirm: null })} onConfirm={confirmModal.onConfirm} title="Remove Audio" message="Are you sure you want to remove this audio file?" />
        </div>
    );
};