import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdminState, TeacherState } from '../types';

const NAVIGATION_STORAGE_KEY = 'learningPlatformNavigation';
const LAST_ACTIVITY_KEY = 'learningPlatformLastActivity';
const SYSTEM_RESTART_DETECTED_KEY = 'learningPlatformRestartDetected';

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

interface PersistentNavigationState {
  adminState: AdminState;
  teacherState: TeacherState;
  lastUpdated: number;
}

const defaultAdminState: AdminState = {
  classId: null, subjectId: null, unitId: null, subUnitId: null, lessonId: null,
  selectedResourceType: null, activePage: 'browser', scrollPosition: 0
};

const defaultTeacherState: TeacherState = {
  classId: null, subjectId: null, unitId: null, subUnitId: null, lessonId: null,
  selectedResourceType: null, scrollPosition: 0
};

const defaultNavigationState: PersistentNavigationState = {
  adminState: defaultAdminState,
  teacherState: defaultTeacherState,
  lastUpdated: Date.now()
};

export const usePersistentNavigation = () => {
  const [navigationState, setNavigationState] = useState<PersistentNavigationState>(() => {
    try {
      const savedState = localStorage.getItem(NAVIGATION_STORAGE_KEY);
      const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
      const restartDetected = localStorage.getItem(SYSTEM_RESTART_DETECTED_KEY);
      
      console.log('[PersistentNavigation] Initializing...', {
        hasSavedState: !!savedState,
        hasLastActivity: !!lastActivity,
        restartDetected
      });
      
      // Clear storage if system restart was detected
      if (restartDetected === 'true') {
        console.log('[PersistentNavigation] System restart detected, clearing state');
        localStorage.removeItem(NAVIGATION_STORAGE_KEY);
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        localStorage.removeItem(SYSTEM_RESTART_DETECTED_KEY);
        return defaultNavigationState;
      }
      
      // Check if session has expired
      if (lastActivity) {
        const lastActivityTime = parseInt(lastActivity, 10);
        const now = Date.now();
        if (now - lastActivityTime > SESSION_TIMEOUT) {
          console.log('[PersistentNavigation] Session expired, clearing state');
          localStorage.removeItem(NAVIGATION_STORAGE_KEY);
          localStorage.removeItem(LAST_ACTIVITY_KEY);
          return defaultNavigationState;
        }
      }
      
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState) as PersistentNavigationState;
          console.log('[PersistentNavigation] Successfully loaded saved state:', parsed);
          
          // Check if the saved state has actual data
          const hasAdminData = parsed.adminState && (
            parsed.adminState.classId || 
            parsed.adminState.subjectId || 
            parsed.adminState.unitId || 
            parsed.adminState.lessonId ||
            parsed.adminState.selectedResourceType
          );
          
          const hasTeacherData = parsed.teacherState && (
            parsed.teacherState.classId || 
            parsed.teacherState.subjectId || 
            parsed.teacherState.unitId || 
            parsed.teacherState.lessonId ||
            parsed.teacherState.selectedResourceType
          );
          
          console.log('[PersistentNavigation] State has data:', { hasAdminData, hasTeacherData });
          
          // Simple merge - just use the saved state directly
          const restoredState = {
            adminState: { ...defaultAdminState, ...parsed.adminState },
            teacherState: { ...defaultTeacherState, ...parsed.teacherState },
            lastUpdated: parsed.lastUpdated || Date.now()
          };
          
          console.log('[PersistentNavigation] Restored state:', restoredState);
          return restoredState;
        } catch (parseError) {
          console.error('[PersistentNavigation] Failed to parse saved state:', parseError);
          localStorage.removeItem(NAVIGATION_STORAGE_KEY);
          localStorage.removeItem(LAST_ACTIVITY_KEY);
        }
      } else {
        console.log('[PersistentNavigation] No saved state found, using defaults');
      }
    } catch (error) {
      console.error('[PersistentNavigation] Error reading navigation state:', error);
      localStorage.removeItem(NAVIGATION_STORAGE_KEY);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
    }
    
    return defaultNavigationState;
  });

  // Update last activity timestamp
  const updateLastActivity = useCallback(() => {
    try {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to update last activity:', error);
    }
  }, []);

  // Debounced save function to avoid excessive localStorage writes
  const debouncedSaveTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const debouncedSave = useCallback((state: Partial<PersistentNavigationState>) => {
    if (debouncedSaveTimeout.current) {
      clearTimeout(debouncedSaveTimeout.current);
    }
    
    debouncedSaveTimeout.current = setTimeout(() => {
      const newState = {
        ...navigationState,
        ...state,
        lastUpdated: Date.now()
      };
      
      console.log('[PersistentNavigation] Debounced saving state:', newState);
      setNavigationState(newState);
      localStorage.setItem(NAVIGATION_STORAGE_KEY, JSON.stringify(newState));
      updateLastActivity();
    }, 100); // Small delay to batch rapid changes
  }, [navigationState, updateLastActivity]);

  // Update admin state with debounced saving
  const updateAdminState = useCallback((updates: Partial<AdminState>) => {
    console.log('[PersistentNavigation] Updating admin state with:', updates);
    const newAdminState = { ...navigationState.adminState, ...updates };
    console.log('[PersistentNavigation] New admin state will be:', newAdminState);
    debouncedSave({ adminState: newAdminState });
  }, [navigationState.adminState, debouncedSave]);

  // Update teacher state with debounced saving
  const updateTeacherState = useCallback((updates: Partial<TeacherState>) => {
    console.log('[PersistentNavigation] Updating teacher state with:', updates);
    const newTeacherState = { ...navigationState.teacherState, ...updates };
    console.log('[PersistentNavigation] New teacher state will be:', newTeacherState);
    debouncedSave({ teacherState: newTeacherState });
  }, [navigationState.teacherState, debouncedSave]);

  // Clear navigation state (used for logout)
  const clearNavigationState = useCallback(() => {
    console.log('[PersistentNavigation] Clearing navigation state');
    localStorage.removeItem(NAVIGATION_STORAGE_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    setNavigationState(defaultNavigationState);
  }, []);

  // System restart detection and cleanup
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      console.log('[PersistentNavigation] Browser closing, marking restart');
      localStorage.setItem(SYSTEM_RESTART_DETECTED_KEY, 'true');
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateLastActivity();
      }
    };

    // Save state on page unload to ensure no data is lost
    const handlePageHide = () => {
      console.log('[PersistentNavigation] Page hiding, force saving state');
      try {
        localStorage.setItem(NAVIGATION_STORAGE_KEY, JSON.stringify(navigationState));
      } catch (error) {
        console.error('Failed to save state on page hide:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Update activity on mount
    updateLastActivity();
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateLastActivity, navigationState]);

  // Periodic activity update
  useEffect(() => {
    const interval = setInterval(updateLastActivity, 5 * 60 * 1000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, [updateLastActivity]);

  // Debug function to force save current state
  const forceSave = useCallback(() => {
    console.log('[PersistentNavigation] Force saving current state');
    localStorage.setItem(NAVIGATION_STORAGE_KEY, JSON.stringify(navigationState));
  }, [navigationState]);

  // Check if we have actual restored data (not just default values)
  const hasRestoredData = () => {
    const adminState = navigationState.adminState;
    const teacherState = navigationState.teacherState;
    
    // Check if any meaningful navigation data was restored
    const adminHasData = !!(adminState.classId || adminState.subjectId || adminState.unitId || adminState.subUnitId || adminState.lessonId || adminState.selectedResourceType);
    const teacherHasData = !!(teacherState.classId || teacherState.subjectId || teacherState.unitId || teacherState.subUnitId || teacherState.lessonId || teacherState.selectedResourceType);
    
    return adminHasData || teacherHasData;
  };

  const hasTimeChanged = navigationState.lastUpdated !== defaultNavigationState.lastUpdated;
  const hasData = hasRestoredData();
  const isNavigationRestored = Boolean(hasTimeChanged && hasData);

  return {
    adminState: navigationState.adminState,
    teacherState: navigationState.teacherState,
    updateAdminState,
    updateTeacherState,
    clearNavigationState,
    isNavigationRestored,
    getCurrentState: () => ({
      adminState: navigationState.adminState,
      teacherState: navigationState.teacherState,
      lastUpdated: navigationState.lastUpdated,
      isRestored: isNavigationRestored
    }),
    forceSave
  };
};