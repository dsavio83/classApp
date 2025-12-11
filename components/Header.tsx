import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { FullScreenIcon, ExitFullScreenIcon, LogoutIcon, SettingsIcon, UsersIcon } from './icons/AdminIcons';
import { SelectionModal } from './SelectionModal';
import { ResolutionModal } from './ResolutionModal';


interface HeaderProps {
    user: User;
    onToggleSidebar: () => void;
    onToggleAdminSidebar?: () => void;
    onLogout: () => void;
    selectedClass?: string;
    onClassSelect?: () => void;
    onProfile?: () => void;
}

const MenuIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);

const SunIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
);

const MoonIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
);

const ProfileIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

const LockClosedIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);

const ChevronDownIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="6,9 12,15 18,9"></polyline></svg>
);

export const Header: React.FC<HeaderProps> = ({ user, onToggleSidebar, onToggleAdminSidebar, onLogout, selectedClass, onClassSelect, onProfile }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.theme === 'dark' || 
             (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState(selectedClass || '8');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedSubUnitId, setSelectedSubUnitId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update current class when selectedClass prop changes
  useEffect(() => {
    if (selectedClass) {
      setCurrentClass(selectedClass);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen?.();
    }
  };

  const handleResolutionSelect = (resolution: string) => {
    // Apply resolution changes based on selection
    console.log('Selected resolution:', resolution);
    // Here you can add logic to actually change the page resolution
    // For now, we'll just log it
  };

  useEffect(() => {
    const onFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullScreenChange);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between px-2 sm:px-4 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-30 shrink-0">
      <div className="flex items-center space-x-2 sm:space-x-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Toggle resource sidebar"
        >
          <MenuIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 dark:text-gray-300" />
        </button>



        {/* Hide title text in fullscreen */}
        {!isFullScreen && (
          <div className="flex items-center space-x-3">
            <h1 className="text-sm sm:text-xl font-bold text-gray-800 dark:text-white truncate max-w-40 sm:max-w-none">
              Learning Platform
            </h1>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-1 sm:space-x-2">
        {/* Fullscreen button - Desktop only - Hidden on mobile */}
        <button
          onClick={toggleFullScreen}
          className="hidden md:flex w-8 h-8 sm:w-7 sm:h-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150 items-center justify-center overflow-hidden"
          title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
        >
          {isFullScreen ? (
            <ExitFullScreenIcon className="h-6 w-6 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <FullScreenIcon className="h-6 w-6 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>

        {/* Admin Settings Icon - visible on all devices for admin users */}
        {user.role === 'admin' && onToggleAdminSidebar && (
          <button
            onClick={onToggleAdminSidebar}
            className="w-8 h-8 sm:w-7 sm:h-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150 flex items-center justify-center overflow-hidden"
            title="Admin Settings"
          >
            <SettingsIcon className="h-6 w-6 sm:h-6 sm:w-6 text-gray-600 dark:text-gray-300" />
          </button>
        )}
        
        {/* User dropdown container */}
        <div className="relative" ref={dropdownRef}>

          
          {/* Dropdown menu - positioned to align with user avatar */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700 transform origin-top-right">
              <button
                onClick={() => {
                  onProfile?.();
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors duration-150"
              >
                <UsersIcon className="h-4 w-4" />
                <span>Profile</span>
              </button>
              
              <hr className="border-gray-200 dark:border-gray-600 my-1" />
              <button
                onClick={() => {
                  toggleDarkMode();
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors duration-150"
              >
                {isDarkMode ? (
                  <SunIcon className="h-4 w-4" />
                ) : (
                  <MoonIcon className="h-4 w-4" />
                )}
                <span>Toggle Dark Mode</span>
              </button>
              
              <hr className="border-gray-200 dark:border-gray-600 my-1" />
              <button
                onClick={() => {
                  onLogout();
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors duration-150"
              >
                <LogoutIcon className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
          
          {/* User avatar button with dropdown arrow */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-8 h-8 sm:w-7 sm:h-7 bg-blue-500 rounded-full user-avatar text-white font-semibold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150 mobile-user-icon flex items-center justify-center overflow-hidden"
            aria-label="User menu"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            <span className="text-sm sm:text-xs font-medium leading-none select-none">
              {user.name?.[0]}
            </span>
          </button>
        </div>


      </div>

      {/* Selection Modal - Mobile Only */}
      <SelectionModal
        isOpen={isSelectionModalOpen}
        onClose={() => setIsSelectionModalOpen(false)}
        classId={selectedClassId}
        subjectId={selectedSubjectId}
        unitId={selectedUnitId}
        subUnitId={selectedSubUnitId}
        lessonId={selectedLessonId}
        onClassChange={setSelectedClassId}
        onSubjectChange={setSelectedSubjectId}
        onUnitChange={setSelectedUnitId}
        onSubUnitChange={setSelectedSubUnitId}
        onLessonChange={setSelectedLessonId}
        onSave={() => {
          // Update current class display if a class was selected
          if (selectedClassId) {
            // Try to extract class number from class ID or use current class
            setCurrentClass(selectedClass || '8');
          }
          // Call the original onClassSelect if provided
          if (onClassSelect) {
            onClassSelect();
          }
        }}
        defaultClass="8"
      />
      {/* Resolution Modal */}
      <ResolutionModal
        isOpen={isResolutionModalOpen}
        onClose={() => setIsResolutionModalOpen(false)}
        onResolutionSelect={handleResolutionSelect}
      />

     
    </header>
  );
};