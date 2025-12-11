import { useState, useEffect, useCallback } from 'react';

export interface TemporarySelections {
  classId: string | null;
  subjectId: string | null;
  unitId: string | null;
  subUnitId: string | null;
  lessonId: string | null;
}

// Storage key for temporary selections
const TEMP_SELECTIONS_KEY = 'learningPlatformTempSelections';

// Default empty selections
const defaultSelections: TemporarySelections = {
  classId: null,
  subjectId: null,
  unitId: null,
  subUnitId: null,
  lessonId: null
};

/**
 * Hook for managing temporary selection state that persists across page refreshes
 * but can be easily reset programmatically
 */
export const useTemporarySelections = () => {
  // Load selections from localStorage on mount
  const [selections, setSelections] = useState<TemporarySelections>(() => {
    try {
      const savedSelections = localStorage.getItem(TEMP_SELECTIONS_KEY);
      if (savedSelections) {
        const parsed = JSON.parse(savedSelections);
        console.log('[TempSelections] Loaded from storage:', parsed);
        return { ...defaultSelections, ...parsed };
      }
    } catch (error) {
      console.error('[TempSelections] Failed to parse saved selections:', error);
      localStorage.removeItem(TEMP_SELECTIONS_KEY);
    }
    console.log('[TempSelections] Using default selections');
    return defaultSelections;
  });

  // Save selections to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(TEMP_SELECTIONS_KEY, JSON.stringify(selections));
      console.log('[TempSelections] Saved to storage:', selections);
    } catch (error) {
      console.error('[TempSelections] Failed to save selections:', error);
    }
  }, [selections]);

  // Update a specific selection
  const updateSelection = useCallback(<K extends keyof TemporarySelections>(
    key: K,
    value: TemporarySelections[K]
  ) => {
    console.log('[TempSelections] Updating selection:', { key, value });
    setSelections(prev => ({ ...prev, [key]: value }));
  }, []);

  // Update multiple selections at once
  const updateSelections = useCallback((updates: Partial<TemporarySelections>) => {
    console.log('[TempSelections] Updating multiple selections:', updates);
    setSelections(prev => ({ ...prev, ...updates }));
  }, []);

  // Reset all selections to null
  const resetSelections = useCallback(() => {
    console.log('[TempSelections] Resetting all selections');
    setSelections(defaultSelections);
    localStorage.removeItem(TEMP_SELECTIONS_KEY);
  }, []);

  // Check if any selections are made
  const hasSelections = useCallback(() => {
    return Object.values(selections).some(value => value !== null);
  }, [selections]);

  // Get the current selection level (highest level with a selection)
  const getCurrentSelectionLevel = useCallback(() => {
    if (selections.lessonId) return 'lesson';
    if (selections.subUnitId) return 'subUnit';
    if (selections.unitId) return 'unit';
    if (selections.subjectId) return 'subject';
    if (selections.classId) return 'class';
    return null;
  }, [selections]);

  // Clear selections up to a certain level
  const clearSelectionsFromLevel = useCallback((level: keyof TemporarySelections) => {
    console.log('[TempSelections] Clearing selections from level:', level);
    const levelOrder: (keyof TemporarySelections)[] = ['classId', 'subjectId', 'unitId', 'subUnitId', 'lessonId'];
    const levelIndex = levelOrder.indexOf(level);
    
    if (levelIndex === -1) return;
    
    const newSelections = { ...selections };
    // Clear all levels from the specified level onwards
    for (let i = levelIndex; i < levelOrder.length; i++) {
      newSelections[levelOrder[i]] = null;
    }
    
    setSelections(newSelections);
  }, [selections]);

  return {
    selections,
    updateSelection,
    updateSelections,
    resetSelections,
    hasSelections,
    getCurrentSelectionLevel,
    clearSelectionsFromLevel
  };
};

export default useTemporarySelections;