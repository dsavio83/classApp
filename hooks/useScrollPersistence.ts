// /hooks/useScrollPersistence.ts
import { useEffect, useRef, useCallback } from 'react';

type UpdateFn = (position: number) => void;

/**
 * useScrollPersistence
 *
 * @param scrollPosition - saved scrollTop value from state/store
 * @param updateScrollPosition - function to call when scroll changes (persists new value)
 * @param dependencies - optional deps array that should trigger restore when changed (e.g. lessonId)
 *
 * Returns { scrollElementRef, handleScroll }
 *
 * Usage:
 * const { scrollElementRef, handleScroll } = useScrollPersistence(scrollTop, setScrollTop, [lessonId]);
 * <div ref={scrollElementRef} onScroll={handleScroll}>...</div>
 */
export const useScrollPersistence = (
    scrollPosition: number,
    updateScrollPosition: UpdateFn,
    dependencies: any[] = []
) => {
    const scrollElementRef = useRef<HTMLElement | null>(null);
    const isRestoringRef = useRef(false);
    const lastSavedRef = useRef<number | null>(null);

    // Restore scroll position when dependencies change (or initial mount)
    useEffect(() => {
        const el = scrollElementRef.current;
        if (!el) return;

        // If there's no meaningful scrollPosition, skip
        if (typeof scrollPosition !== 'number' || Number.isNaN(scrollPosition)) return;

        // Avoid triggering save while we set the scroll
        isRestoringRef.current = true;

        try {
            // Cap scrollPosition to element's scrollHeight to avoid errors
            const maxScroll = el.scrollHeight - el.clientHeight;
            const to = Math.max(0, Math.min(scrollPosition, Math.max(0, maxScroll)));
            // Only set if differs by a few pixels to avoid unnecessary layout thrash
            if (Math.abs(el.scrollTop - to) > 1) {
                el.scrollTop = to;
            }
            lastSavedRef.current = to;
        } finally {
            // Give browser a tick before allowing save (use setTimeout 0)
            window.setTimeout(() => {
                isRestoringRef.current = false;
            }, 0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scrollPosition, ...dependencies]);

    // Scroll handler (memoized)
    const handleScroll = useCallback(() => {
        const el = scrollElementRef.current;
        if (!el) return;
        if (isRestoringRef.current) return;

        const newTop = el.scrollTop;

        // Avoid calling update if practically same as last saved
        if (lastSavedRef.current !== null && Math.abs(lastSavedRef.current - newTop) <= 1) {
            return;
        }

        lastSavedRef.current = newTop;
        updateScrollPosition(newTop);
    }, [updateScrollPosition]);

    // Add optional safety: if component mounts and ref is not set, try to find main scrollable area
    useEffect(() => {
        if (scrollElementRef.current) return;

        // try to find a sensible default scroll container within document if not set by consumer
        // (only do this if consumer forgot to attach ref)
        const possible = document.querySelector<HTMLElement>('#root, main, .app, body');
        if (possible && possible !== document.body && possible.scrollHeight > possible.clientHeight) {
            // only auto-attach if not already defined by consumer
            scrollElementRef.current = possible;
        }
        // no cleanup for auto attach (consumer should prefer explicit ref attach)
    }, []);

    return {
        scrollElementRef,
        handleScroll,
    };
};

export default useScrollPersistence;
