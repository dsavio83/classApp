import React, { useState, useEffect } from 'react';
import { useSession } from '../context/SessionContext';

interface SelectionRestorationIndicatorProps {
  className?: string;
}

export const SelectionRestorationIndicator: React.FC<SelectionRestorationIndicatorProps> = ({ 
  className = '' 
}) => {
  const { isNavigationRestored, session } = useSession();
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (isNavigationRestored) {
      setShowIndicator(true);
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setShowIndicator(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isNavigationRestored]);

  // Check if there are any actual selections in either admin or teacher state
  const hasSelections = () => {
    const adminState = session.adminState;
    const teacherState = session.teacherState;
    
    // Check if any meaningful selections exist
    const adminHasSelections = adminState.classId || adminState.subjectId || adminState.unitId || adminState.subUnitId || adminState.lessonId;
    const teacherHasSelections = teacherState.classId || teacherState.subjectId || teacherState.unitId || teacherState.subUnitId || teacherState.lessonId;
    
    return adminHasSelections || teacherHasSelections;
  };

  // Only show if navigation was restored AND there are actual selections
  if (!showIndicator || !hasSelections() || !isNavigationRestored) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${className}`}>
      <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 max-w-sm">
        <div className="flex-shrink-0">
          <svg 
            className="w-5 h-5" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Selections Restored</p>
          <p className="text-xs opacity-90">
            Your previous Class, Subject, Unit, and Chapter selections have been loaded.
          </p>
        </div>
        <button
          onClick={() => setShowIndicator(false)}
          className="flex-shrink-0 ml-2 text-white hover:text-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path 
              fillRule="evenodd" 
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
              clipRule="evenodd" 
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Compact version for use in headers or smaller spaces
export const CompactSelectionIndicator: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  const { isNavigationRestored, session } = useSession();
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (isNavigationRestored) {
      setShowIndicator(true);
      const timer = setTimeout(() => {
        setShowIndicator(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isNavigationRestored]);

  // Check if there are any actual selections in either admin or teacher state
  const hasSelections = () => {
    const adminState = session.adminState;
    const teacherState = session.teacherState;
    
    // Check if any meaningful selections exist
    const adminHasSelections = adminState.classId || adminState.subjectId || adminState.unitId || adminState.subUnitId || adminState.lessonId;
    const teacherHasSelections = teacherState.classId || teacherState.subjectId || teacherState.unitId || teacherState.subUnitId || teacherState.lessonId;
    
    return adminHasSelections || teacherHasSelections;
  };

  // Only show if navigation was restored AND there are actual selections
  if (!showIndicator || !hasSelections() || !isNavigationRestored) {
    return null;
  }

  return (
    <div className={`inline-flex items-center space-x-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs ${className}`}>
      <svg 
        className="w-3 h-3" 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path 
          fillRule="evenodd" 
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
          clipRule="evenodd" 
        />
      </svg>
      <span>Restored</span>
    </div>
  );
};

export default SelectionRestorationIndicator;