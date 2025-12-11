import React, { useEffect, useRef, useCallback } from 'react';
import { processContentForHTML } from '../../utils/htmlUtils';

declare const Quill: any;

interface NoteEditorProps {
    initialValue: string;
    onSave: (html: string) => Promise<void>;
    onCancel: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ initialValue, onSave, onCancel }) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const quillInstance = useRef<any>(null);
    const isSaving = useRef(false);

    const generateTableHTML = (rows: number, cols: number): string => {
        // Use Unicode box drawing characters to create visual table
        let tableText = '';
        
        // Create table using monospace formatting
        const cellWidth = 15; // Width for each cell
        
        // Top border
        tableText += '┌';
        for (let col = 0; col < cols; col++) {
            tableText += '─'.repeat(cellWidth);
            if (col < cols - 1) tableText += '┬';
        }
        tableText += '┐\n';
        
        // Header row
        tableText += '│';
        for (let col = 0; col < cols; col++) {
            const header = `Header ${col + 1}`;
            const padding = Math.max(0, cellWidth - header.length);
            tableText += header + ' '.repeat(padding);
            tableText += '│';
        }
        tableText += '\n';
        
        // Separator after header
        tableText += '├';
        for (let col = 0; col < cols; col++) {
            tableText += '─'.repeat(cellWidth);
            if (col < cols - 1) tableText += '┼';
        }
        tableText += '┤\n';
        
        // Data rows
        for (let row = 1; row < rows; row++) {
            tableText += '│';
            for (let col = 0; col < cols; col++) {
                const cell = `Cell ${row}_${col + 1}`;
                const padding = Math.max(0, cellWidth - cell.length);
                tableText += cell + ' '.repeat(padding);
                tableText += '│';
            }
            tableText += '\n';
        }
        
        // Bottom border
        tableText += '└';
        for (let col = 0; col < cols; col++) {
            tableText += '─'.repeat(cellWidth);
            if (col < cols - 1) tableText += '┴';
        }
        tableText += '┘\n\n';
        
        // Wrap in monospace div for better formatting
        return `<div class="table-formatted" style="font-family: 'Courier New', monospace; background-color: #f8f9fa; padding: 10px; border: 1px solid #ddd; border-radius: 4px; white-space: pre; line-height: 1.2;">${tableText}</div>`;
    };

    const setupQuill = useCallback(() => {
        if (wrapperRef.current && !quillInstance.current) {
            const editorContainer = wrapperRef.current.querySelector('.editor');
            const toolbarContainer = wrapperRef.current.querySelector('.toolbar');
            
            if (editorContainer && toolbarContainer) {
                // Configure Quill with HTML support
                const quill = new Quill(editorContainer, {
                    debug: false,
                    theme: 'snow',
                    modules: {
                        toolbar: {
                            container: toolbarContainer,
                            handlers: {
                                'formula-custom': function() {
                                    const formula = prompt('Enter your LaTeX formula (without delimiters):');
                                    if (formula) {
                                        const range = this.quill.getSelection(true);
                                        this.quill.insertText(range.index, `$${formula}$`, 'user');
                                    }
                                },
                                'table': function() {
                                    const rows = parseInt(prompt('Enter number of rows (1-10):', '3') || '3');
                                    const cols = parseInt(prompt('Enter number of columns (1-10):', '3') || '3');
                                    
                                    if (rows > 0 && rows <= 10 && cols > 0 && cols <= 10) {
                                        const range = this.quill.getSelection(true);
                                        const tableHTML = generateTableHTML(rows, cols);
                                        
                                        // Insert table HTML using Quill's clipboard API
                                        this.quill.clipboard.dangerouslyPasteHTML(range.index, tableHTML, 'user');
                                        
                                        // Set selection after the table
                                        this.quill.setSelection(range.index + 1, 0, 'user');
                                        
                                        // Trigger formatting after insertion
                                        setTimeout(() => {
                                            this.quill.format('line-height', '1.2');
                                        }, 100);
                                    }
                                }
                            }
                        },
                        history: {
                            delay: 1000,
                            maxStack: 50,
                            userOnly: true
                        },
                        clipboard: {
                            matchVisual: false
                        }
                    },
                    placeholder: 'Start writing your notes here...',
                });

                // Load content as HTML and render it properly
                const processedContent = processContentForHTML(initialValue);
                
                // Clear existing content first
                quill.setText('');
                
                // Handle HTML content properly to show visual output, not code
                quill.root.innerHTML = processedContent;
                
                // Force re-rendering to ensure HTML displays as visual content
                quill.setSelection(0, 0);
                
                // Process all HTML elements to ensure proper visual display
                setTimeout(() => {
                    const editorElement = quill.root;
                    
                    // Find and process all table-formatted elements
                    const tableElements = editorElement.querySelectorAll('.table-formatted');
                    tableElements.forEach(element => {
                        // Ensure table elements are visible and properly styled
                        element.style.display = 'block';
                        element.style.fontFamily = "'Courier New', monospace";
                        element.style.backgroundColor = '#f8f9fa';
                        element.style.border = '2px solid #333';
                        element.style.borderRadius = '6px';
                        element.style.padding = '15px';
                        element.style.margin = '10px 0';
                        element.style.whiteSpace = 'pre';
                        element.style.lineHeight = '1.2';
                    });
                    
                    // Process any other HTML elements to ensure they render visually
                    const allElements = editorElement.querySelectorAll('*');
                    allElements.forEach(element => {
                        // Skip Quill's internal elements
                        if (!element.classList.contains('ql-editor') && 
                            !element.closest('.ql-editor')) {
                            // Ensure HTML tags don't show as code
                            if (element.tagName === 'DIV' || element.tagName === 'SPAN') {
                                element.style.display = element.style.display || 'block';
                            }
                        }
                    });
                }, 200);
                
                quillInstance.current = quill;
            }
        }
    }, [initialValue]);

    useEffect(() => {
        setupQuill();
    }, [setupQuill]);

    const handleSaveClick = async () => {
        if (quillInstance.current && !isSaving.current) {
            isSaving.current = true;
            
            // Get the HTML content from Quill editor
            let content = quillInstance.current.root.innerHTML;
            
            // If content is empty or just whitespace, create basic content
            if (!content || content.trim() === '' || content === '<p><br></p>') {
                content = '<p>New note content...</p>';
            }
            
            // Fix HTML content for proper storage and retrieval
            // Ensure all HTML tags are properly formed
            content = content.replace(/<div class="table-formatted">([\s\S]*?)<\/div>/g, (match, tableContent) => {
                return `<div class="table-formatted">${tableContent}</div>`;
            });
            
            // Save the content
            await onSave(content);
            isSaving.current = false;
        }
    };

    return (
        <div ref={wrapperRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 w-full note-editor-container">
            <style>{`
                .table-formatted {
                    font-family: 'Courier New', monospace !important;
                    background-color: #f8f9fa !important;
                    padding: 15px !important;
                    border: 2px solid #333 !important;
                    border-radius: 6px !important;
                    white-space: pre !important;
                    line-height: 1.2 !important;
                    margin: 10px 0 !important;
                    display: block !important;
                }
                .table-formatted:hover {
                    background-color: #e9ecef !important;
                    border-color: #007bff !important;
                }
                /* Ensure HTML tables render properly in Quill editor */
                .ql-editor table {
                    border-collapse: collapse;
                    width: 100%;
                    margin: 10px 0;
                }
                .ql-editor th, .ql-editor td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                .ql-editor th {
                    background-color: #f2f2f2;
                    font-weight: bold;
                }
            `}</style>
            
            <div className="toolbar border border-gray-300 dark:border-gray-600 rounded-t-lg bg-gray-50 dark:bg-gray-700 p-1">
                <span className="ql-formats">
                    <select className="ql-header" defaultValue=""></select>
                </span>
                <span className="ql-formats">
                    <button className="ql-bold"></button>
                    <button className="ql-italic"></button>
                    <button className="ql-underline"></button>
                </span>
                <span className="ql-formats">
                    <select className="ql-align" defaultValue="">
                        <option value=""></option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                        <option value="justify">Justify</option>
                    </select>
                </span>
                <span className="ql-formats">
                    <select className="ql-color"></select>
                    <select className="ql-background"></select>
                </span>
                <span className="ql-formats">
                    <button className="ql-list" value="ordered"></button>
                    <button className="ql-list" value="bullet"></button>
                    <button className="ql-blockquote"></button>
                </span>
                <span className="ql-formats">
                    <button className="ql-table" title="Insert Table">
                        <svg viewBox="0 0 18 18" style={{ width: '18px', height: '18px' }}>
                            <rect className="ql-stroke" height="7" rx="1" ry="1" width="2" x="2" y="2"></rect>
                            <rect className="ql-stroke" height="7" rx="1" ry="1" width="2" x="8" y="2"></rect>
                            <path className="ql-fill" d="M2,9h6v7H2Z"></path>
                            <path className="ql-fill" d="M8,9h8v7H8Z"></path>
                        </svg>
                    </button>
                </span>
                <span className="ql-formats">
                    <button className="ql-link"></button>
                    <button className="ql-image"></button>
                    <button className="ql-video"></button>
                </span>
                <span className="ql-formats">
                    <button className="ql-formula-custom" type="button" title="Insert Formula (LaTeX)">
                         <svg viewBox="0 0 18 18" style={{ width: '18px', height: '18px' }}>
                            <text x="2" y="14" style={{ fontFamily: 'monospace, sans-serif', fontSize: '14px' }}>ƒx</text>
                        </svg>
                    </button>
                </span>
                <span className="ql-formats">
                    <button className="ql-clean"></button>
                </span>
            </div>
            <div className="editor h-96 border-l border-r border-b border-gray-300 dark:border-gray-600 rounded-b-lg"></div>
            <div className="mt-4 flex justify-end space-x-3">
                <button onClick={onCancel} className="flex items-center gap-2 px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500" title="Cancel">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    <span className="hidden sm:inline">Cancel</span>
                </button>
                <button onClick={handleSaveClick} className="flex items-center gap-2 px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700" title="Save Note">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="hidden sm:inline">Save Note</span>
                </button>
            </div>
        </div>
    );
};