/**
 * Utility functions for managing persistent navigation state
 */

export interface NavigationStorageInfo {
    hasStoredState: boolean;
    lastUpdated: number;
    sessionExpired: boolean;
    hasValidIds: boolean;
}

// Clear all navigation data from localStorage
export const clearAllNavigationData = (): void => {
    const keys = [
        'learningPlatformNavigation',
        'learningPlatformLastActivity',
        'learningPlatformRestartDetected'
    ];
    
    keys.forEach(key => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn(`Failed to remove ${key} from localStorage:`, error);
        }
    });
};

// Get information about current navigation storage
export const getNavigationStorageInfo = (): NavigationStorageInfo => {
    try {
        const storedState = localStorage.getItem('learningPlatformNavigation');
        const lastActivity = localStorage.getItem('learningPlatformLastActivity');
        
        if (!storedState || !lastActivity) {
            return {
                hasStoredState: false,
                lastUpdated: 0,
                sessionExpired: false,
                hasValidIds: false
            };
        }
        
        const parsedState = JSON.parse(storedState);
        const lastActivityTime = parseInt(lastActivity, 10);
        const now = Date.now();
        const sessionTimeout = 30 * 60 * 1000; // 30 minutes
        
        // Check if session has expired
        const sessionExpired = (now - lastActivityTime) > sessionTimeout;
        
        // Check if the state has valid IDs (basic validation)
        const hasValidIds = Boolean(
            parsedState?.adminState?.classId || 
            parsedState?.teacherState?.classId ||
            parsedState?.adminState?.lessonId ||
            parsedState?.teacherState?.lessonId
        );
        
        return {
            hasStoredState: true,
            lastUpdated: parsedState?.lastUpdated || 0,
            sessionExpired,
            hasValidIds
        };
    } catch (error) {
        console.error('Failed to get navigation storage info:', error);
        return {
            hasStoredState: false,
            lastUpdated: 0,
            sessionExpired: true,
            hasValidIds: false
        };
    }
};

// Force clear navigation data and trigger a page reload (useful for debugging)
export const forceClearAndReload = (): void => {
    clearAllNavigationData();
    window.location.reload();
};

// Log navigation state for debugging
export const debugNavigationState = (): void => {
    const info = getNavigationStorageInfo();
    console.group('🔍 Navigation State Debug Info');
    console.log('Storage Info:', info);
    
    try {
        const storedState = localStorage.getItem('learningPlatformNavigation');
        if (storedState) {
            const parsed = JSON.parse(storedState);
            console.log('Stored Navigation State:', parsed);
        } else {
            console.log('No stored navigation state found');
        }
        
        const lastActivity = localStorage.getItem('learningPlatformLastActivity');
        if (lastActivity) {
            const lastActivityTime = new Date(parseInt(lastActivity, 10));
            console.log('Last Activity:', lastActivityTime.toLocaleString());
        }
    } catch (error) {
        console.error('Error reading navigation state:', error);
    }
    
    console.groupEnd();
};

// Set up keyboard shortcut for debugging (Ctrl+Shift+N)
export const setupDebugKeyboardShortcuts = (): (() => void) => {
    const handleKeyDown = (event: KeyboardEvent) => {
        // Ctrl+Shift+N: Debug navigation state
        if (event.ctrlKey && event.shiftKey && event.key === 'N') {
            event.preventDefault();
            debugNavigationState();
        }
        
        // Ctrl+Shift+C: Clear navigation state and reload
        if (event.ctrlKey && event.shiftKey && event.key === 'C') {
            event.preventDefault();
            if (confirm('Clear all navigation data and reload page?')) {
                forceClearAndReload();
            }
        }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    // Return cleanup function
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
};