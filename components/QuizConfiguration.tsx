import React, { useState, useEffect, useCallback } from 'react';
import { CascadeSelectors } from './CascadeSelectors';
import { useApi } from '../hooks/useApi';
import * as api from '../services/api';
import { QuizQuestion, AnswerOption, Content } from '../types';
import { PlusIcon, TrashIcon, ImportIcon, SaveIcon, EditIcon } from './icons/AdminIcons';
import { ConfirmModal } from './ConfirmModal';
import { useToast } from '../context/ToastContext';

const ImportJsonModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onImport: (questions: QuizQuestion[]) => void;
}> = ({ isOpen, onClose, onImport }) => {
    const [input, setInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setInput('');
            setError(null);
        }
    }, [isOpen]);

    const autoFixJson = (jsonStr: string): string => {
        console.log('[autoFixJson] Attempting to auto-fix JSON syntax errors...');
        
        let fixed = jsonStr;
        let fixesApplied = 0;
        
        try {
            // Fix 1: Add missing closing quotes - find patterns like: "text without closing quote
            // Look for quote followed by text that should be in quotes but lacks closing quote
            const lines = fixed.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                // Check for lines that have opening quote but may be missing closing quote
                if (line.includes('"') && !line.match(/^.*".*".*$/)) {
                    // This line might have an unclosed string
                    const trimmed = line.trim();
                    if (trimmed.startsWith('"') && !trimmed.endsWith('"')) {
                        // Add closing quote to this line
                        lines[i] = trimmed + '"';
                        fixesApplied++;
                        console.log('[autoFixJson] Fixed unclosed quote on line', i + 1);
                    }
                }
            }
            fixed = lines.join('\n');
            
            // Fix 2: Fix common property name issues
            fixed = fixed.replace(/"answerOption"/g, '"answerOptions"');
            fixesApplied++;
            
            // Fix 3: Remove trailing commas before closing brackets/braces
            fixed = fixed.replace(/,\s*}/g, '}');
            fixed = fixed.replace(/,\s*]/g, ']');
            fixesApplied += 2;
            
            // Fix 4: Fix unclosed object/array issues
            const openBraces = (fixed.match(/{/g) || []).length;
            const closeBraces = (fixed.match(/}/g) || []).length;
            const openBrackets = (fixed.match(/\[/g) || []).length;
            const closeBrackets = (fixed.match(/\]/g) || []).length;
            
            // Add missing closing braces
            for (let i = closeBraces; i < openBraces; i++) {
                fixed += '}';
                fixesApplied++;
            }
            
            // Add missing closing brackets
            for (let i = closeBrackets; i < openBrackets; i++) {
                fixed += ']';
                fixesApplied++;
            }
            
            console.log('[autoFixJson] Applied', fixesApplied, 'automatic fixes');
            
            // Test if the fix worked
            JSON.parse(fixed);
            console.log('[autoFixJson] Auto-fix successful!');
            return fixed;
            
        } catch (e) {
            console.log('[autoFixJson] Auto-fix failed, original error:', e.message);
            return jsonStr; // Return original if auto-fix doesn't work
        }
    };

    const validateJsonStructure = (jsonStr: string): string | null => {
        // Check basic structure
        const trimmed = jsonStr.trim();
        if (!trimmed.startsWith('[')) {
            return "JSON must start with '['";
        }
        if (!trimmed.endsWith(']')) {
            return "JSON must end with ']'";
        }
        
        // Check for common syntax issues
        const issues = [];
        const lines = trimmed.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.includes('&quot;')) {
                issues.push(`Line ${i + 1}: Still contains &quot; entities`);
            }
            if (line.includes('&#39;')) {
                issues.push(`Line ${i + 1}: Still contains &#39; entities`);
            }
            // Check for unclosed quotes
            const doubleQuotes = (line.match(/"/g) || []).length;
            const singleQuotes = (line.match(/'/g) || []).length;
            if (doubleQuotes % 2 !== 0) {
                issues.push(`Line ${i + 1}: Unclosed double quote`);
            }
        }
        
        return issues.length > 0 ? issues.join('; ') : null;
    };

    const sanitizeAndParse = (raw: string): QuizQuestion[] | null => {
        console.log('[sanitizeAndParse] Raw input (first 200 chars):', raw.substring(0, 200));
        
        // Check for HTML entities before replacement
        const entityCheck = validateJsonStructure(raw);
        if (entityCheck) {
            console.log('[sanitizeAndParse] Entity check result:', entityCheck);
        }
        
        // Comprehensive HTML entity replacement
        let clean = raw.trim()
            .replace(/&quot;/g, '"')           // Replace &quot; with "
            .replace(/&#39;/g, "'")           // Replace &#39; with '
            .replace(/&amp;/g, '&')           // Replace &amp; with &
            .replace(/&lt;/g, '<')            // Replace &lt; with <
            .replace(/&gt;/g, '>')            // Replace &gt; with >
            .replace(/&#34;/g, '"')           // Replace &#34; with "
            .replace(/&#38;/g, '&')           // Replace &#38; with &
            .replace(/&#60;/g, '<')           // Replace &#60; with <
            .replace(/&#62;/g, '>')           // Replace &#62; with >
            .replace(/[\u201C\u201D]/g, '"')  // Replace smart quotes with "
            .replace(/[\u2018\u2019]/g, "'"); // Replace smart single quotes with '

        console.log('[sanitizeAndParse] Cleaned input (first 200 chars):', clean.substring(0, 200));
        console.log('[sanitizeAndParse] Cleaned input length:', clean.length);
        
        try {
            // Validate JSON structure before parsing
            const structureCheck = validateJsonStructure(clean);
            if (structureCheck) {
                throw new Error(`JSON structure issues: ${structureCheck}`);
            }

            const parsed = JSON.parse(clean);
            if (!Array.isArray(parsed)) {
                throw new Error("JSON must be an array of questions.");
            }
            
            console.log('[sanitizeAndParse] Successfully parsed:', parsed.length, 'questions');
            return parsed;
        } catch (e) {
            console.error('[sanitizeAndParse] First parsing attempt failed:', e.message);
            console.error('[sanitizeAndParse] Attempting automatic JSON fixing...');
            
            // Try auto-fix
            try {
                const fixedJson = autoFixJson(clean);
                if (fixedJson !== clean) {
                    console.log('[sanitizeAndParse] Auto-fix applied, trying to parse fixed JSON...');
                    const parsed = JSON.parse(fixedJson);
                    if (!Array.isArray(parsed)) {
                        throw new Error("JSON must be an array of questions.");
                    }
                    console.log('[sanitizeAndParse] Successfully parsed after auto-fix:', parsed.length, 'questions');
                    return parsed;
                }
            } catch (fixError) {
                console.error('[sanitizeAndParse] Auto-fix failed:', fixError.message);
            }
            
            // If auto-fix failed, show detailed error
            console.error('[sanitizeAndParse] Raw input length:', raw.length);
            console.error('[sanitizeAndParse] First 100 chars:', raw.substring(0, 100));
            console.error('[sanitizeAndParse] Last 100 chars:', raw.substring(Math.max(0, raw.length - 100)));
            
            // Try to extract position from error message
            const positionMatch = e.message.match(/position (\d+)/);
            if (positionMatch) {
                const pos = parseInt(positionMatch[1]);
                const errorContextStart = Math.max(0, pos - 50);
                const errorContextEnd = Math.min(clean.length, pos + 50);
                console.error('[sanitizeAndParse] Error context around position', pos + ':', clean.substring(errorContextStart, errorContextEnd));
                
                // Analyze the specific error
                const errorChar = clean[pos];
                const beforeChar = clean[pos - 1];
                const afterChar = clean[pos + 1];
                console.error('[sanitizeAndParse] Error analysis:');
                console.error('[sanitizeAndParse]  - Error character:', JSON.stringify(errorChar));
                console.error('[sanitizeAndParse]  - Character before:', JSON.stringify(beforeChar));
                console.error('[sanitizeAndParse]  - Character after:', JSON.stringify(afterChar));
            }
            return null;
        }
    };

    const handlePreview = () => {
        console.log('[Quiz Import] Current input:', input);
        const parsed = sanitizeAndParse(input);
        if (parsed) {
            setInput(JSON.stringify(parsed, null, 2));
            setError(null);
            console.log('[Quiz Import] Successfully parsed and formatted');
        } else {
            setError("Invalid JSON format. Please check your input.");
            console.log('[Quiz Import] Failed to parse JSON');
        }
    };

    const handleImport = () => {
        const parsed = sanitizeAndParse(input);
        if (parsed) {
            onImport(parsed);
            onClose();
        } else {
            setError("Invalid JSON. Cannot import.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl flex flex-col max-h-[90vh]">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Import Quiz JSON</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Paste your JSON below. HTML entities are automatically replaced as you type (&amp;quot; → ", &amp;#39; → ', &amp;amp; → &, etc.).
                </p>
                <textarea
                    value={input}
                    onChange={(e) => { 
                        // Automatically replace HTML entities as user types/pastes
                        const cleanedValue = e.target.value
                            .replace(/&quot;/g, '"')           // Replace &quot; with "
                            .replace(/&#39;/g, "'")           // Replace &#39; with '
                            .replace(/&amp;/g, '&')           // Replace &amp; with &
                            .replace(/&lt;/g, '<')            // Replace &lt; with <
                            .replace(/&gt;/g, '>')            // Replace &gt; with >
                            .replace(/&#34;/g, '"')           // Replace &#34; with "
                            .replace(/&#38;/g, '&')           // Replace &#38; with &
                            .replace(/&#60;/g, '<')           // Replace &#60; with <
                            .replace(/&#62;/g, '>')           // Replace &#62; with >
                            .replace(/[\u201C\u201D]/g, '"')  // Replace smart quotes with "
                            .replace(/[\u2018\u2019]/g, "'"); // Replace smart single quotes with '
                        setInput(cleanedValue); 
                        setError(null); 
                    }}
                    onPaste={(e) => {
                        // Get pasted content and replace HTML entities immediately
                        e.preventDefault();
                        const pastedText = e.clipboardData.getData('text');
                        const cleanedValue = pastedText
                            .replace(/&quot;/g, '"')           // Replace &quot; with "
                            .replace(/&#39;/g, "'")           // Replace &#39; with '
                            .replace(/&amp;/g, '&')           // Replace &amp; with &
                            .replace(/&lt;/g, '<')            // Replace &lt; with <
                            .replace(/&gt;/g, '>')            // Replace &gt; with >
                            .replace(/&#34;/g, '"')           // Replace &#34; with "
                            .replace(/&#38;/g, '&')           // Replace &#38; with &
                            .replace(/&#60;/g, '<')           // Replace &#60; with <
                            .replace(/&#62;/g, '>')           // Replace &#62; with >
                            .replace(/[\u201C\u201D]/g, '"')  // Replace smart quotes with "
                            .replace(/[\u2018\u2019]/g, "'"); // Replace smart single quotes with '
                        
                        // Insert the cleaned text at cursor position
                        const target = e.target as HTMLTextAreaElement;
                        const start = target.selectionStart;
                        const end = target.selectionEnd;
                        const newValue = input.substring(0, start) + cleanedValue + input.substring(end);
                        setInput(newValue);
                        setError(null);
                        
                        // Set cursor position after inserted text
                        setTimeout(() => {
                            const newCursorPos = start + cleanedValue.length;
                            target.setSelectionRange(newCursorPos, newCursorPos);
                        }, 0);
                    }}
                    className="flex-1 w-full p-3 border rounded-md font-mono text-xs bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder={`[\n  {\n    "question": "Your Question?",\n    "answerOptions": [...]\n  }\n]`}
                    rows={15}
                />
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                <div className="flex justify-end gap-3 mt-4">
                    <button onClick={handlePreview} className="px-4 py-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-800">
                        Format & Preview
                    </button>
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">
                        Cancel
                    </button>
                    <button onClick={handleImport} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Import
                    </button>
                </div>
            </div>
        </div>
    );
};

export const QuizConfiguration: React.FC = () => {
    // Selection State
    const [classId, setClassId] = useState<string | null>(null);
    const [subjectId, setSubjectId] = useState<string | null>(null);
    const [unitId, setUnitId] = useState<string | null>(null);
    const [subUnitId, setSubUnitId] = useState<string | null>(null);
    const [lessonId, setLessonId] = useState<string | null>(null);

    // Quiz Data State
    const [quizList, setQuizList] = useState<Content[]>([]);
    const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
    const [quizTitle, setQuizTitle] = useState('Lesson Quiz');
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);

    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);

    const { showToast } = useToast();

    // Cascading Reset Logic: Reset dependent selectors when parent selector changes
    useEffect(() => {
        // When class changes, reset all dependent selectors
        setSubjectId(null);
        setUnitId(null);
        setSubUnitId(null);
        setLessonId(null);
    }, [classId]);

    useEffect(() => {
        // When subject changes, reset all dependent selectors
        setUnitId(null);
        setSubUnitId(null);
        setLessonId(null);
    }, [subjectId]);

    useEffect(() => {
        // When unit changes, reset all dependent selectors
        setSubUnitId(null);
        setLessonId(null);
    }, [unitId]);

    useEffect(() => {
        // When sub-unit changes, reset lesson selector
        setLessonId(null);
    }, [subUnitId]);

    // Fetch existing quizzes when lessonId changes
    useEffect(() => {
        if (!lessonId) {
            setQuizList([]);
            setQuestions([]);
            setSelectedQuizId(null);
            setQuizTitle('Lesson Quiz');
            return;
        }

        const loadQuizzes = async () => {
            setIsLoading(true);
            try {
                const grouped = await api.getContentsByLessonId(lessonId, ['quiz']);
                const quizzes = grouped?.[0]?.docs || [];
                setQuizList(quizzes);

                // If quizzes exist, select the first one by default
                if (quizzes.length > 0) {
                    selectQuiz(quizzes[0]);
                } else {
                    createNewQuiz();
                }
            } catch (e) {
                console.error("Error loading quizzes", e);
                showToast("Failed to load quizzes", "error");
            } finally {
                setIsLoading(false);
            }
        };

        loadQuizzes();
    }, [lessonId]);

    const selectQuiz = (quiz: Content) => {
        setSelectedQuizId(quiz._id);
        setQuizTitle(quiz.title);
        try {
            // Comprehensive HTML entity replacement when loading quizzes
            const cleanBody = quiz.body
                .replace(/&quot;/g, '"')           // Replace &quot; with "
                .replace(/&#39;/g, "'")           // Replace &#39; with '
                .replace(/&amp;/g, '&')           // Replace &amp; with &
                .replace(/&lt;/g, '<')            // Replace &lt; with <
                .replace(/&gt;/g, '>')            // Replace &gt; with >
                .replace(/&#34;/g, '"')           // Replace &#34; with "
                .replace(/&#38;/g, '&')           // Replace &#38; with &
                .replace(/&#60;/g, '<')           // Replace &#60; with <
                .replace(/&#62;/g, '>')           // Replace &#62; with >
                .replace(/[\u201C\u201D]/g, '"')  // Replace smart quotes with "
                .replace(/[\u2018\u2019]/g, "'"); // Replace smart single quotes with '
            setQuestions(JSON.parse(cleanBody));
        } catch (e) {
            console.error("Failed to parse quiz", e);
            setQuestions([]);
        }
        setIsDirty(false);
    };

    const createNewQuiz = () => {
        setSelectedQuizId(null);
        setQuizTitle('New Quiz');
        setQuestions([]);
        setIsDirty(false);
    };

    // CRUD Operations for Questions
    const addQuestion = () => {
        const newQ: QuizQuestion = {
            question: '',
            answerOptions: [
                { text: '', isCorrect: false, rationale: '' },
                { text: '', isCorrect: false, rationale: '' }
            ],
            hint: ''
        };
        setQuestions([...questions, newQ]);
        setIsDirty(true);
    };

    const deleteQuestion = (index: number) => {
        const updated = [...questions];
        updated.splice(index, 1);
        setQuestions(updated);
        setIsDirty(true);
        showToast('Question removed', 'error');
    };

    const updateQuestionField = (index: number, field: keyof QuizQuestion, value: any) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };
        setQuestions(updated);
        setIsDirty(true);
    };

    // CRUD Operations for Options
    const addOption = (qIndex: number) => {
        const updated = [...questions];
        updated[qIndex].answerOptions.push({ text: '', isCorrect: false, rationale: '' });
        setQuestions(updated);
        setIsDirty(true);
    };

    const deleteOption = (qIndex: number, oIndex: number) => {
        const updated = [...questions];
        updated[qIndex].answerOptions.splice(oIndex, 1);
        setQuestions(updated);
        setIsDirty(true);
    };

    const updateOption = (qIndex: number, oIndex: number, field: keyof AnswerOption, value: any) => {
        const updated = [...questions];
        const option = updated[qIndex].answerOptions[oIndex];
        updated[qIndex].answerOptions[oIndex] = { ...option, [field]: value };
        setQuestions(updated);
        setIsDirty(true);
    };

    const handleSave = async () => {
        if (!lessonId) return;
        setIsSaving(true);
        try {
            const body = JSON.stringify(questions);
            let savedContent: Content;

            if (selectedQuizId) {
                savedContent = await api.updateContent(selectedQuizId, {
                    title: quizTitle,
                    body
                });
                // Update list
                setQuizList(prev => prev.map(q => q._id === selectedQuizId ? savedContent : q));
            } else {
                savedContent = await api.addContent({
                    lessonId,
                    type: 'quiz',
                    title: quizTitle,
                    body
                });
                setQuizList(prev => [...prev, savedContent]);
                setSelectedQuizId(savedContent._id);
            }

            setIsDirty(false);
            showToast("Quiz saved successfully!", 'success');
        } catch (e) {
            showToast("Failed to save quiz.", 'error');
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
            {/* Selectors Area */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10">
                <div className="p-4">
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white mb-4">Quiz Configuration</h1>
                    <CascadeSelectors
                        classId={classId}
                        subjectId={subjectId}
                        unitId={unitId}
                        subUnitId={subUnitId}
                        lessonId={lessonId}
                        onClassChange={setClassId}
                        onSubjectChange={setSubjectId}
                        onUnitChange={setUnitId}
                        onSubUnitChange={setSubUnitId}
                        onLessonChange={setLessonId}
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex">
                {!lessonId ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        <p>Please select a lesson (leaf node) to configure its quiz.</p>
                    </div>
                ) : isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">Loading...</div>
                    </div>
                ) : (
                    <>
                        {/* Sidebar - Quiz List */}
                        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <h2 className="font-semibold text-gray-700 dark:text-gray-200">Quizzes</h2>
                                <button
                                    onClick={createNewQuiz}
                                    className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded"
                                    title="Create New Quiz"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {quizList.map(quiz => (
                                    <button
                                        key={quiz._id}
                                        onClick={() => selectQuiz(quiz)}
                                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedQuizId === quiz._id
                                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {quiz.title}
                                    </button>
                                ))}
                                {quizList.length === 0 && (
                                    <div className="text-center py-4 text-xs text-gray-400">
                                        No quizzes found.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Main Editor */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                            <div className="max-w-4xl mx-auto space-y-6">
                                {/* Toolbar */}
                                <div className="flex flex-col gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1 mr-4">
                                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Quiz Title</label>
                                            <input
                                                type="text"
                                                value={quizTitle}
                                                onChange={(e) => { setQuizTitle(e.target.value); setIsDirty(true); }}
                                                className="w-full p-2 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="flex gap-3 items-end">
                                            <button
                                                onClick={() => setImportModalOpen(true)}
                                                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors h-10"
                                            >
                                                <ImportIcon className="w-4 h-4" />
                                                <span>Import JSON</span>
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                disabled={!isDirty || isSaving}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-md text-sm font-semibold transition-colors h-10"
                                            >
                                                <SaveIcon className="w-4 h-4" />
                                                <span>{isSaving ? 'Saving...' : isDirty ? 'Save Changes' : 'Saved'}</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {questions.length} Questions
                                    </div>
                                </div>

                                {/* Questions List */}
                                {questions.map((q, qIndex) => (
                                    <div key={qIndex} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Question {qIndex + 1}</h3>
                                            <button onClick={() => deleteQuestion(qIndex)} className="text-red-500 hover:text-red-700 p-1" title="Delete Question">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Question Input */}
                                        <div className="mb-4">
                                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Question Text (HTML Supported)</label>
                                            <textarea
                                                value={q.question}
                                                onChange={(e) => updateQuestionField(qIndex, 'question', e.target.value)}
                                                className="w-full p-3 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                                                placeholder="Enter question here..."
                                            />
                                        </div>

                                        {/* Hint Input */}
                                        <div className="mb-4">
                                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Hint (Optional)</label>
                                            <input
                                                type="text"
                                                value={q.hint}
                                                onChange={(e) => updateQuestionField(qIndex, 'hint', e.target.value)}
                                                className="w-full p-2 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                placeholder="Enter a hint..."
                                            />
                                        </div>

                                        {/* Answer Options */}
                                        <div className="space-y-3">
                                            <label className="block text-xs font-medium text-gray-500 uppercase">Answer Options</label>
                                            {q.answerOptions.map((opt, oIndex) => (
                                                <div key={oIndex} className="flex gap-3 items-start bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                                                    <div className="pt-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={opt.isCorrect}
                                                            onChange={(e) => updateOption(qIndex, oIndex, 'isCorrect', e.target.checked)}
                                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                                            title="Mark as Correct Answer"
                                                        />
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <input
                                                            type="text"
                                                            value={opt.text}
                                                            onChange={(e) => updateOption(qIndex, oIndex, 'text', e.target.value)}
                                                            className="w-full p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                                                            placeholder="Option Text (HTML Supported)"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={opt.rationale}
                                                            onChange={(e) => updateOption(qIndex, oIndex, 'rationale', e.target.value)}
                                                            className="w-full p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 italic focus:ring-1 focus:ring-blue-500 outline-none"
                                                            placeholder="Rationale / Explanation (Optional)"
                                                        />
                                                    </div>
                                                    <button onClick={() => deleteOption(qIndex, oIndex)} className="text-gray-400 hover:text-red-500 p-1">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button onClick={() => addOption(qIndex)} className="text-sm text-blue-600 hover:text-blue-500 font-medium flex items-center gap-1 mt-2">
                                                <PlusIcon className="w-3 h-3" /> Add Option
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* Action Buttons */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
                                    <button
                                        onClick={addQuestion}
                                        className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors flex flex-col items-center justify-center gap-2"
                                    >
                                        <PlusIcon className="w-8 h-8" />
                                        <span className="font-medium">Add New Question</span>
                                    </button>

                                    <button
                                        onClick={handleSave}
                                        disabled={!isDirty || isSaving}
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex flex-col items-center justify-center gap-2 shadow-md"
                                    >
                                        <SaveIcon className="w-8 h-8" />
                                        <span className="font-medium">{isSaving ? 'Saving...' : isDirty ? 'Save Changes' : 'Saved'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <ImportJsonModal
                isOpen={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                onImport={(newQuestions) => {
                    setQuestions(prev => [...prev, ...newQuestions]);
                    setIsDirty(true);
                }}
            />
        </div>
    );
};