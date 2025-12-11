/**
 * HTML Processing Utilities
 * Provides functions to handle HTML content rendering across all content views
 */

// Detect if text contains HTML content or encoded HTML entities
export const containsHTML = (text: string): boolean => {
    if (!text) return false;
    return /<[^>]*>/.test(text) || /&[a-zA-Z0-9#]+;/.test(text) || /&lt;[^&]*&gt;/.test(text);
};

// Clean up empty paragraphs and unnecessary spacing
export const cleanupHTML = (content: string): string => {
    if (!content) return '';
    
    let cleaned = content;
    
    // Remove empty paragraphs with &nbsp;
    cleaned = cleaned.replace(/<p>\s*&nbsp;\s*<\/p>/gi, '');
    
    // Remove completely empty paragraphs
    cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '');
    
    // Remove multiple consecutive empty paragraphs
    cleaned = cleaned.replace(/(<p>\s*<\/p>\s*){2,}/gi, '');
    
    // Clean up extra whitespace around paragraphs
    cleaned = cleaned.replace(/\s+<\/p>/gi, '</p>');
    cleaned = cleaned.replace(/<p>\s+/gi, '<p>');
    
    return cleaned;
};

// Decode HTML entities to their actual characters
export const decodeHTMLEntities = (text: string): string => {
    if (!text) return '';
    
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
};

// Check if content appears to be encoded HTML (double-escaped)
export const isEncodedHTML = (text: string): boolean => {
    if (!text) return false;
    // Look for patterns like <div> which suggest encoded HTML
    return /<[a-zA-Z/][^&]*>/.test(text) || /<\/[^&]*>/.test(text);
};

// Process HTML content to ensure it renders properly
export const processHTMLContent = (content: string): string => {
    if (!content) return '';
    
    let processed = content;
    
    // If content appears to be encoded HTML, decode it
    if (isEncodedHTML(processed)) {
        processed = decodeHTMLEntities(processed);
    }
    
    // Remove empty <p> tags and &nbsp; only content
    processed = processed.replace(/<p>\s*&nbsp;\s*<\/p>/gi, '');
    processed = processed.replace(/<p>\s*<\/p>/gi, '');
    
    // Check if content contains block-level elements that shouldn't be wrapped
    const hasBlockElements = /<(table|div|h[1-6]|ul|ol|li|pre|blockquote|header|footer|section|article|nav|form|fieldset|hr)/i.test(processed);
    
    // Ensure we have valid HTML structure, but don't wrap content with block elements
    if (!processed.includes('<') || !processed.includes('>')) {
        // If no HTML tags found, treat as plain text and wrap in paragraph
        if (processed.trim() && !hasBlockElements) {
            processed = `<p>${processed}</p>`;
        }
    }
    
    return processed;
};

// Enhanced HTML content processing with styling and structure support
export const enhanceHTMLContent = (content: string): string => {
    if (!content) return '';
    
    let enhanced = content;
    
    // Decode entities first
    enhanced = decodeHTMLEntities(enhanced);
    
    // Add CSS classes for better styling
    enhanced = enhanced.replace(
        /<pre><code([^>]*)>/g,
        '<pre class="html-code-block bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto"><code$1 class="text-sm">'
    );
    
    enhanced = enhanced.replace(
        /<table/g,
        '<table class="w-full border-collapse border border-gray-300 dark:border-gray-600 my-4"'
    );
    
    enhanced = enhanced.replace(
        /<th/g,
        '<th class="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-700 font-semibold"'
    );
    
    enhanced = enhanced.replace(
        /<td/g,
        '<td class="border border-gray-300 dark:border-gray-600 px-4 py-2"'
    );
    
    enhanced = enhanced.replace(
        /<h([1-6])/g,
        '<h$1 class="font-bold text-gray-800 dark:text-white mt-6 mb-4"'
    );
    
    enhanced = enhanced.replace(
        /<p>/g,
        '<p class="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">'
    );
    
    enhanced = enhanced.replace(
        /<strong>/g,
        '<strong class="font-bold text-gray-900 dark:text-white">'
    );
    
    enhanced = enhanced.replace(
        /<em>/g,
        '<em class="italic text-gray-800 dark:text-gray-200">'
    );
    
    enhanced = enhanced.replace(
        /<ul>/g,
        '<ul class="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">'
    );
    
    enhanced = enhanced.replace(
        /<ol>/g,
        '<ol class="list-decimal list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">'
    );
    
    enhanced = enhanced.replace(
        /<li>/g,
        '<li class="text-gray-700 dark:text-gray-300">'
    );
    
    enhanced = enhanced.replace(
        /<blockquote>/g,
        '<blockquote class="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400 my-4">'
    );
    
    return enhanced;
};

// Safe HTML rendering function that handles encoding issues
export const safeHTMLRender = (content: string): string => {
    if (!content) return '';
    
    // First check if it's encoded HTML that needs decoding
    if (isEncodedHTML(content)) {
        content = decodeHTMLEntities(content);
    }
    
    // Remove empty <p> tags and &nbsp; only content
    content = content.replace(/<p>\s*&nbsp;\s*<\/p>/gi, '');
    content = content.replace(/<p>\s*<\/p>/gi, '');
    
    // If it's still not HTML, wrap it as text
    if (!containsHTML(content)) {
        return `<div class="text-gray-700 dark:text-gray-300">${content}</div>`;
    }
    
    return content;
};

// Add HTML rendering capabilities to text content
export const addHTMLSupport = (text: string): string => {
    if (!text) return '';
    
    // If it looks like it contains HTML entities, decode them
    if (isEncodedHTML(text)) {
        text = decodeHTMLEntities(text);
    }
    
    // If no HTML tags are present but contains HTML entities, it was likely intended as HTML
    if (!/<[a-zA-Z/][^>]*>/.test(text) && /&[a-zA-Z0-9#]+;/.test(text)) {
        // Decode HTML entities but keep the text as plain text
        return decodeHTMLEntities(text);
    }
    
    // If it already has HTML tags, return as is
    if (/<[a-zA-Z/][^>]*>/.test(text)) {
        return text;
    }
    
    // Otherwise, treat as plain text
    return text;
};

// Detect and handle HTML code blocks
export const handleHTMLCodeBlocks = (content: string): string => {
    if (!content) return '';
    
    let processed = content;
    
    // Pattern to match HTML code in various formats
    const htmlCodePatterns = [
        /`<pre><code[^>]*>([^<]*(&lt;[^&]*&gt;)[^<]*)<\/code><\/pre>`/gi,
        /`<code[^>]*>([^<]*(&lt;[^&]*&gt;)[^<]*)<\/code>`/gi,
        /```html\s*([\s\S]*?)\s*```/gi,
        /```\s*([\s\S]*?)\s*```/gi
    ];
    
    htmlCodePatterns.forEach(pattern => {
        processed = processed.replace(pattern, (match, codeContent) => {
            // Decode HTML entities in the code
            const decodedCode = decodeHTMLEntities(codeContent);
            return `<pre class="html-code-display bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto font-mono text-sm"><code>${decodedCode}</code></pre>`;
        });
    });
    
    return processed;
};

// Comprehensive HTML content processor
export const processContentForHTML = (content: string): string => {
    if (!content) return '';
    
    let processed = content;
    
    // First, decode any HTML entities
    processed = decodeHTMLEntities(processed);
    
    // Remove empty <p> tags and &nbsp; only content early
    processed = processed.replace(/<p>\s*&nbsp;\s*<\/p>/gi, '');
    processed = processed.replace(/<p>\s*<\/p>/gi, '');
    
    // Handle HTML code blocks
    processed = handleHTMLCodeBlocks(processed);
    
    // Check if content contains block-level elements
    const hasBlockElements = /<(table|div|h[1-6]|ul|ol|li|pre|blockquote|header|footer|section|article|nav|form|fieldset|hr)/i.test(processed);
    
    // If content doesn't have HTML tags but contains what looks like HTML, wrap it appropriately
    if (!/<[a-zA-Z/][^>]*>/.test(processed) && processed.trim()) {
        if (hasBlockElements) {
            // Don't wrap content that contains block elements
            processed = `<div class="text-gray-700 dark:text-gray-300">${processed}</div>`;
        } else {
            // Only wrap simple text content
            processed = `<p class="text-white-700 dark:text-gray-300">${processed}</p>`;
        }
    }
    
    // Clean up any remaining empty paragraphs
    processed = processed.replace(/<p>\s*<\/p>/gi, '');
    
    return processed;
};