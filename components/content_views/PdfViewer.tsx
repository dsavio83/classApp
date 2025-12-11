import React, { useState, useEffect, useRef, useCallback } from 'react';

// Icons for controls
const ZoomInIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
);
const ZoomOutIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
);
const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="15 18 9 12 15 6"></polyline></svg>
);
const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="9 18 15 12 9 6"></polyline></svg>
);
const FullscreenIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
);
const ExitFullscreenIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
);

import * as pdfjsLib from 'pdfjs-dist';

// Configure worker - using local worker file with CDN fallback
const CDN_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
const LOCAL_WORKER_URL = '/pdf.worker.min.js';

// Set up worker configuration with fallbacks
pdfjsLib.GlobalWorkerOptions.workerSrc = LOCAL_WORKER_URL;

interface PdfViewerProps {
    url: string; // The data: or http: URL of the PDF
    initialScale?: number; // Optional prop to set initial zoom level
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ url, initialScale = 1.0 }) => {
    // State
    const [pdfDoc, setPdfDoc] = useState<any>(null);
    const [pageNum, setPageNum] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [scale, setScale] = useState(initialScale);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const renderTaskRef = useRef<any>(null); // Store the render task to cancel it if needed
    const loadingTaskRef = useRef<any>(null); // Store loading task to prevent premature destruction
    const mountedRef = useRef(true); // Track component mount status

    // Detect mobile view
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Set default scale based on mobile/desktop view
    useEffect(() => {
        const defaultScale = isMobile ? 0.65 : initialScale;
        setScale(defaultScale);
    }, [isMobile, initialScale]);

    const renderPage = useCallback(async (num: number, currentPdf: any, retryCount = 0) => {
        if (!currentPdf || !canvasRef.current || !containerRef.current || !mountedRef.current) return;

        // Cancel previous render task if it exists
        if (renderTaskRef.current) {
            renderTaskRef.current.cancel();
        }

        try {
            const page = await currentPdf.getPage(num);

            if (!mountedRef.current) return; // Component unmounted during async operation

            const viewport = page.getViewport({ scale });
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context && mountedRef.current) {
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };

                const newRenderTask = page.render(renderContext);
                renderTaskRef.current = newRenderTask;

                await newRenderTask.promise;
                renderTaskRef.current = null; // Clear after successful render
            }
        } catch (e: any) {
            // Check if component is still mounted before handling errors
            if (!mountedRef.current) return;

            // Ignore errors arising from cancelled renders
            if (e.name === 'RenderingCancelledException' || e.message === 'cancelled') {
                // console.debug('Render cancelled');
                return;
            }

            // Handle worker destruction errors with retry mechanism
            if (e.message && (e.message.includes('Worker was destroyed') || e.message.includes('Worker'))) {
                console.warn('PDF worker destroyed, attempting retry...', retryCount);

                // Retry up to 3 times with exponential backoff for worker errors
                if (retryCount < 3 && mountedRef.current) {
                    setTimeout(() => {
                        if (mountedRef.current) {
                            renderPage(num, currentPdf, retryCount + 1);
                        }
                    }, Math.pow(2, retryCount) * 150); // 150ms, 300ms, 600ms
                    return;
                }
            }

            console.error("Render error:", e);

            // Only show user-facing error for non-worker issues
            if (!e.message || !e.message.includes('Worker was destroyed')) {
                setError(`Failed to render PDF page. Please try again.`);
            }
        }
    }, [scale]);

    useEffect(() => {
        if (!url) return;

        if (typeof pdfjsLib === 'undefined') {
            setError("PDF.js library is not loaded.");
            setIsLoading(false);
            return;
        }

        // Set component as mounted
        mountedRef.current = true;

        // Test worker accessibility and configure fallback if needed
        const configureWorkerAndLoad = async () => {
            try {
                const response = await fetch(LOCAL_WORKER_URL, { method: 'HEAD' });
                if (!response.ok) {
                    // Local worker not accessible, use CDN
                    console.warn('Local PDF worker not accessible, using CDN fallback');
                    pdfjsLib.GlobalWorkerOptions.workerSrc = CDN_WORKER_URL;
                }
            } catch (error) {
                console.warn('Failed to access local PDF worker, using CDN fallback:', error);
                pdfjsLib.GlobalWorkerOptions.workerSrc = CDN_WORKER_URL;
            }

            // Now load the document after worker is configured
            const loadingTask = pdfjsLib.getDocument(url);
            loadingTaskRef.current = loadingTask;
            setIsLoading(true);
            setError(null);

            loadingTask.promise.then((doc: any) => {
                // Check if component is still mounted before updating state
                if (mountedRef.current) {
                    setPdfDoc(doc);
                    setNumPages(doc.numPages);
                    setPageNum(1);
                    setIsLoading(false);
                }
            }).catch((err: any) => {
                // Only update state if component is still mounted
                if (!mountedRef.current) return;

                console.error('Error loading PDF:', err);
                if (err.name === 'InvalidPDFException') {
                    setError('Failed to load PDF. Invalid PDF format.');
                } else if (err.name === 'PasswordException') {
                    setError('Failed to load PDF. Password protected files are not supported.');
                } else if (err.name === 'MissingPDFException') {
                    setError('Failed to load PDF. File not found or corrupted.');
                } else if (err.name === 'UnexpectedResponseException') {
                    setError('Failed to load PDF. Network error occurred.');
                } else if (err.message && (err.message.includes('Worker was destroyed') || err.message.includes('Worker'))) {
                    // Don't show user-facing error for worker destruction - attempt silent retry
                    console.warn('Worker destroyed during loading, retrying silently...');
                    setTimeout(() => {
                        if (mountedRef.current && url) {
                            // Retry loading the document
                            const retryLoadingTask = pdfjsLib.getDocument(url);
                            loadingTaskRef.current = retryLoadingTask;
                            setIsLoading(true);
                            setError(null);

                            retryLoadingTask.promise.then((doc: any) => {
                                if (mountedRef.current) {
                                    setPdfDoc(doc);
                                    setNumPages(doc.numPages);
                                    setPageNum(1);
                                    setIsLoading(false);
                                }
                            }).catch((retryErr: any) => {
                                if (!mountedRef.current) return;
                                console.error('PDF reload failed:', retryErr);
                                setError('Failed to load PDF. Please refresh the page.');
                                setIsLoading(false);
                            });
                        }
                    }, 200);
                } else {
                    setError(`Failed to load PDF. ${err.message || 'Unknown error'}.`);
                }
                setIsLoading(false);
            });
        };

        // Start the worker configuration and loading process
        configureWorkerAndLoad();

        return () => {
            // Set component as unmounted
            mountedRef.current = false;

            // Cancel the loading task but don't destroy it immediately
            if (loadingTaskRef.current && loadingTaskRef.current.status !== 'destroyed') {
                try {
                    loadingTaskRef.current.destroy();
                } catch (e) {
                    // Ignore errors during cleanup
                    console.debug('Loading task cleanup error:', e);
                }
            }

            // Cancel any pending render task when unmounting or changing URL
            if (renderTaskRef.current) {
                try {
                    renderTaskRef.current.cancel();
                } catch (e) {
                    // Ignore errors during render task cleanup
                    console.debug('Render task cleanup error:', e);
                }
            }
            setPdfDoc(null);
        };
    }, [url]);

    useEffect(() => {
        if (pdfDoc && mountedRef.current) {
            renderPage(pageNum, pdfDoc);
        }
    }, [pdfDoc, pageNum, renderPage]);

    // Cleanup effect for component unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;

            // Cancel any pending render task
            if (renderTaskRef.current) {
                try {
                    renderTaskRef.current.cancel();
                } catch (e) {
                    console.debug('Render task cleanup error:', e);
                }
            }

            // Cancel loading task if still active
            if (loadingTaskRef.current && loadingTaskRef.current.status !== 'destroyed') {
                try {
                    loadingTaskRef.current.destroy();
                } catch (e) {
                    console.debug('Loading task cleanup error:', e);
                }
            }
        };
    }, []);

    const onPrevPage = () => {
        if (pageNum <= 1) return;
        setPageNum(pageNum - 1);
    };

    const onNextPage = () => {
        if (pageNum >= numPages) return;
        setPageNum(pageNum + 1);
    };

    const onZoomIn = () => {
        setScale(prevScale => prevScale + 0.1);
    };

    const onZoomOut = () => {
        setScale(prevScale => Math.max(0.1, prevScale - 0.1));
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;

        if (!isFullscreen) {
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    // Handle fullscreen change events
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full bg-gray-200 dark:bg-gray-900 flex flex-col relative">
            {/* Toolbar */}
            <div className="w-full flex items-center justify-center p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 sticky top-0 z-10 shrink-0 gap-2 shadow-sm">
                <button onClick={onPrevPage} disabled={pageNum <= 1 || !pdfDoc} className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors" aria-label="Previous Page" title="Previous Page"><ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" /></button>
                <span className="mx-2 text-sm font-medium text-gray-700 dark:text-gray-200">Page {pageNum} of {numPages || '--'}</span>
                <button onClick={onNextPage} disabled={pageNum >= numPages || !pdfDoc} className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors" aria-label="Next Page" title="Next Page"><ChevronRightIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" /></button>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>

                <button onClick={onZoomOut} disabled={!pdfDoc} className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors" aria-label="Zoom Out" title="Zoom Out"><ZoomOutIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" /></button>
                <span className="mx-2 text-sm font-medium text-gray-700 dark:text-gray-200 min-w-[3ch] text-center">{(scale * 100).toFixed(0)}%</span>
                <button onClick={onZoomIn} disabled={!pdfDoc} className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors" aria-label="Zoom In" title="Zoom In"><ZoomInIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" /></button>

                {!isMobile && (
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>
                )}

                {!isMobile && (
                    <button onClick={toggleFullscreen} disabled={!pdfDoc} className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors" aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"} title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                        {isFullscreen ? <ExitFullscreenIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" /> : <FullscreenIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />}
                    </button>
                )}
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-auto flex items-start justify-center bg-gray-500/20 p-4 relative w-full">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 z-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                )}

                {error ? (
                    <div className="text-center p-10 text-red-500 bg-white dark:bg-gray-800 rounded-lg shadow-lg mt-10">
                        <p className="font-bold mb-2">Error</p>
                        {error}
                    </div>
                ) : (
                    <canvas ref={canvasRef} className="shadow-xl max-w-none bg-white" />
                )}
            </div>
        </div>
    );
};