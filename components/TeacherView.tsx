import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CascadeSelectors } from './CascadeSelectors';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ProfilePage } from './ProfilePage';
import { ResourceType } from '../types';
import { ContentDisplay } from './ContentDisplay';
import { useSession } from '../context/SessionContext';
import { TeacherState } from '../types';
import { useScrollPersistence } from '../hooks/useScrollPersistence';
import { SelectionRestorationIndicator } from './SelectionRestorationIndicator';

export const TeacherView: React.FC = () => {
    const { session, logout, updateTeacherState } = useSession();
    const { user, teacherState: state } = session;

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isProfilePageOpen, setIsProfilePageOpen] = useState(false);

    // Debug logging for navigation state
    useEffect(() => {
        console.log('[TeacherView] Navigation state changed:', {
            classId: state.classId,
            subjectId: state.subjectId,
            unitId: state.unitId,
            subUnitId: state.subUnitId,
            lessonId: state.lessonId,
            selectedResourceType: state.selectedResourceType
        });
    }, [state]);

    // Check if device is mobile
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Use scroll persistence hook
    const { scrollElementRef, handleScroll } = useScrollPersistence(
        state.scrollPosition,
        (position) => updateTeacherState({ scrollPosition: position }),
        [state.classId, state.subjectId, state.unitId, state.subUnitId, state.lessonId, state.selectedResourceType]
    );

    // Reset scroll position when navigation state changes (but not scroll itself)
    const updateStateAndResetScroll = useCallback((updates: Partial<TeacherState>) => {
        updateTeacherState({ ...updates, scrollPosition: 0 });
    }, [updateTeacherState]);

    const handleClassChange = useCallback((id: string | null) => {
        updateStateAndResetScroll({ classId: id, subjectId: null, unitId: null, subUnitId: null, lessonId: null, selectedResourceType: null });
    }, [updateStateAndResetScroll]);

    const handleSubjectChange = useCallback((id: string | null) => {
        updateStateAndResetScroll({ subjectId: id, unitId: null, subUnitId: null, lessonId: null, selectedResourceType: null });
    }, [updateStateAndResetScroll]);

    const handleUnitChange = useCallback((id: string | null) => {
        updateStateAndResetScroll({ unitId: id, subUnitId: null, lessonId: null, selectedResourceType: null });
    }, [updateStateAndResetScroll]);

    const handleSubUnitChange = useCallback((id: string | null) => {
        updateStateAndResetScroll({ subUnitId: id, lessonId: null, selectedResourceType: null });
    }, [updateStateAndResetScroll]);

    const handleLessonChange = useCallback((id: string | null) => {
        console.log('[TeacherView] Lesson changed:', { newLessonId: id, previousLessonId: state.lessonId });
        updateStateAndResetScroll({ lessonId: id, selectedResourceType: id ? 'book' : null });
    }, [updateStateAndResetScroll, state.lessonId]);
  
    const handleSelectResourceType = useCallback((resourceType: ResourceType) => {
        updateStateAndResetScroll({ selectedResourceType: resourceType });
        // Auto-hide sidebar on mobile when menu item is selected
        if (isMobile) {
            setSidebarOpen(false);
        }
    }, [updateStateAndResetScroll, isMobile]);

    const handleProfile = useCallback(() => {
        setIsProfilePageOpen(!isProfilePageOpen);
    }, [isProfilePageOpen]);

    if (!user) {
        return null; // Safeguard
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <Header user={user} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} onLogout={logout} onProfile={handleProfile}/>
            <SelectionRestorationIndicator />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar 
                    lessonId={state.lessonId}
                    selectedResourceType={state.selectedResourceType}
                    onSelectResourceType={handleSelectResourceType}
                    isOpen={sidebarOpen}
                />
                <main 
                    ref={scrollElementRef}
                    onScroll={handleScroll}
                    className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-800 overflow-y-auto relative transition-all duration-300 border-l border-gray-200 dark:border-gray-700 h-full">
                    {isProfilePageOpen ? (
                        <div className="h-full overflow-y-auto">
                            <ProfilePage 
                                user={user} 
                                onBack={() => setIsProfilePageOpen(false)} 
                            />
                        </div>
                    ) : (
                        <>
                            <div className="shrink-0">
                                <CascadeSelectors
                                    classId={state.classId}
                                    subjectId={state.subjectId}
                                    unitId={state.unitId}
                                    subUnitId={state.subUnitId}
                                    lessonId={state.lessonId}
                                    onClassChange={handleClassChange}
                                    onSubjectChange={handleSubjectChange}
                                    onUnitChange={handleUnitChange}
                                    onSubUnitChange={handleSubUnitChange}
                                    onLessonChange={handleLessonChange}
                                />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <ContentDisplay
                                    lessonId={state.lessonId}
                                    selectedResourceType={state.selectedResourceType}
                                    user={user}
                                />
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};