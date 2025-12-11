import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, Session, AdminState, TeacherState, FontSize } from '../types';
import { usePersistentNavigation } from '../hooks/usePersistentNavigation';

interface SessionContextType {
    session: Session;
    login: (sessionData: { user: User, token: string }) => void;
    logout: () => void;
    updateProfile: (updatedUser: User) => void;
    updateAdminState: (updates: Partial<AdminState>) => void;
    updateTeacherState: (updates: Partial<TeacherState>) => void;
    setFontSize: (size: FontSize) => void;
    clearNavigationState: () => void;
    isNavigationRestored: boolean;
    getCurrentNavigationState: () => {
        adminState: AdminState;
        teacherState: TeacherState;
        lastUpdated: number;
        isRestored: boolean;
    };
    forceSaveNavigation: () => void;
}

const defaultAdminState: AdminState = {
    classId: null, subjectId: null, unitId: null, subUnitId: null, lessonId: null,
    selectedResourceType: null, activePage: 'browser', scrollPosition: 0
};

const defaultTeacherState: TeacherState = {
    classId: null, subjectId: null, unitId: null, subUnitId: null, lessonId: null,
    selectedResourceType: null, scrollPosition: 0
};

const defaultSession: Session = {
    user: null,
    token: null,
    adminState: defaultAdminState,
    teacherState: defaultTeacherState,
    fontSize: 12 // Default to 12px
};

const LOCAL_STORAGE_KEY = 'learningPlatformSession';
const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize session from localStorage (only authentication data)
    const [session, setSession] = useState<Session>(() => {
        try {
            const savedSession = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedSession) {
                const parsed = JSON.parse(savedSession);
                return {
                    ...defaultSession,
                    user: parsed.user || null,
                    token: parsed.token || null,
                    // Ensure fontSize is a number, fallback to 12 if invalid or old string format
                    fontSize: typeof parsed.fontSize === 'number' ? parsed.fontSize : 12
                };
            }
        } catch (error) {
            console.error("Failed to parse session from localStorage", error);
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
        return defaultSession;
    });

    // Persistent navigation state
    const {
        adminState: persistedAdminState,
        teacherState: persistedTeacherState,
        updateAdminState: updatePersistedAdminState,
        updateTeacherState: updatePersistedTeacherState,
        clearNavigationState: clearPersistedNavigationState,
        isNavigationRestored,
        getCurrentState,
        forceSave
    } = usePersistentNavigation();

    // Combine session and navigation state - apply navigation state immediately when available
    const currentSession: Session = useMemo(() => {
        const combinedSession = {
            ...session,
            adminState: persistedAdminState,
            teacherState: persistedTeacherState
        };
        
        console.log('[SessionContext] Combining session and navigation state:', {
            session: { user: session.user ? 'present' : 'null', token: session.token ? 'present' : 'null', fontSize: session.fontSize },
            navigation: { 
                adminState: { 
                    classId: persistedAdminState.classId, 
                    subjectId: persistedAdminState.subjectId, 
                    unitId: persistedAdminState.unitId,
                    subUnitId: persistedAdminState.subUnitId,
                    lessonId: persistedAdminState.lessonId
                }, 
                teacherState: { 
                    classId: persistedTeacherState.classId, 
                    subjectId: persistedTeacherState.subjectId, 
                    unitId: persistedTeacherState.unitId,
                    subUnitId: persistedTeacherState.subUnitId,
                    lessonId: persistedTeacherState.lessonId
                } 
            },
            isNavigationRestored
        });
        
        return combinedSession;
    }, [session, persistedAdminState, persistedTeacherState, isNavigationRestored]);

    // Save session (authentication data only) to localStorage
    useEffect(() => {
        try {
            const sessionToSave = {
                user: currentSession.user,
                token: currentSession.token,
                fontSize: currentSession.fontSize
            };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessionToSave));
        } catch (error) {
            console.error("Failed to save session to localStorage", error);
        }
    }, [currentSession.user, currentSession.token, currentSession.fontSize]);

    const login = useCallback((sessionData: { user: User, token: string }) => {
        setSession(prev => ({ 
            ...prev, 
            user: sessionData.user, 
            token: sessionData.token 
        }));
    }, []);

    const logout = useCallback(() => {
        // Clear authentication session
        setSession(defaultSession);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        
        // Clear navigation state
        clearPersistedNavigationState();
    }, [clearPersistedNavigationState]);

    const updateProfile = useCallback((updatedUser: User) => {
        setSession(prev => prev.user ? { ...prev, user: updatedUser } : prev);
    }, []);

    const updateAdminState = useCallback((updates: Partial<AdminState>) => {
        // Update persistent navigation state
        updatePersistedAdminState(updates);
    }, [updatePersistedAdminState]);

    const updateTeacherState = useCallback((updates: Partial<TeacherState>) => {
        // Update persistent navigation state
        updatePersistedTeacherState(updates);
    }, [updatePersistedTeacherState]);

    const setFontSize = useCallback((size: FontSize) => {
        setSession(prev => ({ ...prev, fontSize: size }));
    }, []);

    const clearNavigationState = useCallback(() => {
        clearPersistedNavigationState();
    }, [clearPersistedNavigationState]);

    const contextValue = useMemo(() => ({
        session: currentSession,
        login,
        logout,
        updateProfile,
        updateAdminState,
        updateTeacherState,
        setFontSize,
        clearNavigationState,
        isNavigationRestored,
        getCurrentNavigationState: getCurrentState,
        forceSaveNavigation: forceSave
    }), [
        currentSession, 
        login, 
        logout, 
        updateProfile, 
        updateAdminState, 
        updateTeacherState, 
        setFontSize,
        clearNavigationState,
        isNavigationRestored,
        getCurrentState,
        forceSave
    ]);

    return (
        <SessionContext.Provider value={contextValue}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = (): SessionContextType => {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
};