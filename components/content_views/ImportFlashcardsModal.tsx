import React, { useState, useEffect } from 'react';

interface ImportFlashcardsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (cards: { title: string; body: string }[]) => Promise<void>;
}

export const ImportFlashcardsModal: React.FC<ImportFlashcardsModalProps> = ({ isOpen, onClose, onImport }) => {
    const [text, setText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [importMode, setImportMode] = useState<'json' | 'csv'>('json');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setText('');
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Parse CSV content
    const parseCSV = (csvText: string): { title: string; body: string }[] => {
        const lines = csvText.split('\n').filter(line => line.trim());
        const cards: { title: string; body: string }[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Simple CSV parsing - split by comma but handle quoted fields
            const parts = parseCSVLine(line);
            if (parts.length >= 2) {
                cards.push({
                    title: parts[0].trim(),
                    body: parts[1].trim()
                });
            }
        }
        return cards;
    };

    // Helper function to parse CSV line with proper quote handling
    const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"' && nextChar === '"') {
                current += '"';
                i++; // Skip next quote
            } else if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setText(content);
                setImportMode('csv');
                setError(null);
            };
            reader.readAsText(file);
        } else {
            setError('Please select a CSV file.');
        }
    };

    const sanitizeAndParse = (raw: string): any[] | null => {
        try {
            // Sanitize the input by replacing HTML entities for quotes with actual quotes.
            let sanitizedText = raw.trim().replace(/&quot;/g, '"');
            // Handle smart quotes
            sanitizedText = sanitizedText.replace(/[\u201C\u201D]/g, '"');

            const parsedJson = JSON.parse(sanitizedText);
            if (Array.isArray(parsedJson)) {
                return parsedJson;
            }
            return null;
        } catch (e) {
            return null;
        }
    };

    // Check if text contains HTML entities that need to be replaced
    const hasUnformattedQuotes = () => {
        return text.includes('&quot;') || text.includes('&#39;') || text.includes('&amp;') || text.includes('&lt;') || text.includes('&gt;');
    };

    const handleFormat = () => {
        setError(null);
        
        console.log('[Format] Original text:', text.substring(0, 200) + '...');
        
        // Replace all HTML entities for quotes - comprehensive replacement
        const cleanedText = text.trim()
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
        
        console.log('[Format] Cleaned text:', cleanedText.substring(0, 200) + '...');
        
        try {
            const parsed = JSON.parse(cleanedText);
            if (Array.isArray(parsed)) {
                const formattedText = JSON.stringify(parsed, null, 2);
                console.log('[Format] Successfully formatted JSON');
                setText(formattedText);
                // Show success message temporarily
                setError(null);
                // You could also show a success toast here if needed
                return;
            } else {
                setError("JSON must be an array of objects.");
            }
        } catch (e) {
            console.log('[Format] Parse error:', e.message);
            setError(`Invalid JSON syntax after fixing entities: ${e.message}`);
        }
    };

    const handleImport = async () => {
        if (isSaving || !text.trim()) return;

        setIsSaving(true);
        setError(null);
        let cards: { title: string; body: string }[] = [];

        if (importMode === 'csv') {
            // Parse CSV format
            cards = parseCSV(text);
        } else {
            // First try to parse as-is for cases where entities are already correct
            try {
                const parsedJson = JSON.parse(text.trim());
                
                if (Array.isArray(parsedJson)) {
                    cards = parsedJson
                        .filter(item => item && (item.f || item.front || item.title) && (item.b || item.back || item.body))
                        .map(item => ({ 
                            title: (item.f || item.front || item.title || '').trim(), 
                            body: (item.b || item.back || item.body || '').trim() 
                        }));
                }
            } catch (e) {
                // If parsing failed, fix HTML entities and try again
                let processedText = text.trim();
                
                // More robust HTML entity replacement
                processedText = processedText
                    .replace(/&quot;/g, '"')           // Replace &quot; with "
                    .replace(/&#39;/g, "'")           // Replace &#39; with '
                    .replace(/&amp;/g, '&')           // Replace &amp; with &
                    .replace(/&lt;/g, '<')            // Replace &lt; with <
                    .replace(/&gt;/g, '>')            // Replace &gt; with >
                    .replace(/[\u201C\u201D]/g, '"')  // Replace smart quotes with "
                    .replace(/[\u2018\u2019]/g, "'"); // Replace smart single quotes with '

                try {
                    const fixedJson = JSON.parse(processedText);
                    
                    if (Array.isArray(fixedJson)) {
                        cards = fixedJson
                            .filter(item => item && (item.f || item.front || item.title) && (item.b || item.back || item.body))
                            .map(item => ({ 
                                title: (item.f || item.front || item.title || '').trim(), 
                                body: (item.b || item.back || item.body || '').trim() 
                            }));
                    }
                } catch (e2) {
                    // If JSON still fails, try semicolon format as fallback
                    const lines = processedText.split('\n');
                    cards = lines
                        .map(line => line.split(';'))
                        .filter(parts => parts.length >= 2 && parts[0].trim() && parts[1].trim())
                        .map(parts => ({
                            title: parts[0].trim(),
                            body: parts.slice(1).join(';').trim(), // Join rest in case answer has semicolons
                        }));
                }
            }
        }

        if (cards.length > 0) {
            await onImport(cards);
            onClose();
        } else {
            setError(importMode === 'csv' 
                ? 'Could not parse any cards from CSV. Please ensure the format is: Question,Answer'
                : 'Could not parse any cards. Please ensure JSON is an array of objects (e.g., [{"f":"Question", "b":"Answer"}]) or use "Question;Answer" format per line.'
            );
        }
        
        setIsSaving(false);
    };
    
    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Import Flashcards</h2>
                
                {/* Import Mode Selection */}
                <div className="mb-4 flex gap-2">
                    <button 
                        onClick={() => setImportMode('json')}
                        className={`px-3 py-1 text-sm rounded-md ${importMode === 'json' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}
                    >
                        JSON/Text
                    </button>
                    <button 
                        onClick={() => setImportMode('csv')}
                        className={`px-3 py-1 text-sm rounded-md ${importMode === 'csv' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}
                    >
                        CSV File
                    </button>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 space-y-2">
                    {importMode === 'json' ? (
                        <>
                            {/* <p>Paste your JSON content below. Supported formats:</p> */}
                            <ul className="list-disc list-inside text-xs space-y-1">
                                <li><b>JSON Array:</b> <code className="bg-gray-100 dark:bg-gray-700 p-1 rounded-sm select-all">{`[{"f":"Question HTML","b":"Answer HTML"}]`}</code> (Use 'Format' button to clean quotes).</li>
                                {/* <li><b>Plain Text:</b> Each line: <code className="bg-gray-100 dark:bg-gray-700 p-1 rounded-sm select-all">{`Question;Answer`}</code></li> */}
                            </ul>
                        </>
                    ) : (
                        <>
                            {/* <p>Upload a CSV file or paste CSV content. Format:</p> */}
                            <ul className="list-disc list-inside text-xs space-y-1">
                                {/* <li><b>CSV Format:</b> <code className="bg-gray-100 dark:bg-gray-700 p-1 rounded-sm select-all">{`Question,Answer`}</code></li> */}
                                <li><b>First column:</b> Front - <b>Second column:</b> Back</li>
                            </ul>
                        </>
                    )}
                </div>

                {/* File Upload for CSV */}
                {importMode === 'csv' && (
                    <div className="mb-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-md hover:bg-green-200 dark:hover:bg-green-800 text-sm font-medium"
                        >
                            Choose CSV File
                        </button>
                    </div>
                )}
                <textarea
                    value={text}
                    rows={15}
                    onChange={e => { setText(e.target.value); setError(null); }}
                    placeholder={importMode === 'json' 
                        ? `[\n  {\n    "f": "What is <b>HTML</b>?",\n    "b": "HyperText Markup Language"\n  }\n]`
                        : `Question 1,Answer 1\nQuestion 2,Answer 2\nQuestion 3,Answer 3`
                    }
                    className="flex-1 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-xs resize-none"
                    autoFocus
                />
                {error && <p className="text-sm text-red-500 dark:text-red-400 mt-2">{error}</p>}
                {hasUnformattedQuotes() && (
                    <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                        {/* <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            ⚠️ JSON contains HTML entities (&amp;quot;, &amp;#39;, etc.) that need to be fixed. Click "Fix HTML Entities" to format.
                        </p> */}
                    </div>
                )}
                <div className="mt-4 flex justify-end gap-3">
                    {importMode === 'json' && (
                        <button onClick={handleFormat} className="px-4 py-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-800 font-medium text-sm">
                            {hasUnformattedQuotes() ? 'Fix HTML Entities' : 'Format & Preview'}
                        </button>
                    )}
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-sm" disabled={isSaving}>
                        Cancel
                    </button>
                    <button onClick={handleImport} className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-wait text-sm font-medium" disabled={isSaving || !text.trim()}>
                        {isSaving ? 'Importing...' : `Import ${importMode === 'csv' ? 'from CSV' : 'Cards'}`}
                    </button>
                </div>
            </div>
        </div>
    );
};