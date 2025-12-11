import { TemporarySelections } from '../hooks/useTemporarySelections';

// Storage key for temporary selections
const TEMP_SELECTIONS_KEY = 'learningPlatformTempSelections';

// Default empty selections
export const defaultSelections: TemporarySelections = {
  classId: null,
  subjectId: null,
  unitId: null,
  subUnitId: null,
  lessonId: null
};

/**
 * Save temporary selections to localStorage
 */
export const saveTemporarySelections = (selections: TemporarySelections): void => {
  try {
    localStorage.setItem(TEMP_SELECTIONS_KEY, JSON.stringify(selections));
    console.log('[SelectionUtils] Saved selections:', selections);
  } catch (error) {
    console.error('[SelectionUtils] Failed to save selections:', error);
  }
};

/**
 * Load temporary selections from localStorage
 */
export const loadTemporarySelections = (): TemporarySelections => {
  try {
    const savedSelections = localStorage.getItem(TEMP_SELECTIONS_KEY);
    if (savedSelections) {
      const parsed = JSON.parse(savedSelections);
      console.log('[SelectionUtils] Loaded selections:', parsed);
      return { ...defaultSelections, ...parsed };
    }
  } catch (error) {
    console.error('[SelectionUtils] Failed to load selections:', error);
    localStorage.removeItem(TEMP_SELECTIONS_KEY);
  }
  return defaultSelections;
};

/**
 * Clear all temporary selections from localStorage
 */
export const clearTemporarySelections = (): void => {
  try {
    localStorage.removeItem(TEMP_SELECTIONS_KEY);
    console.log('[SelectionUtils] Cleared temporary selections');
  } catch (error) {
    console.error('[SelectionUtils] Failed to clear selections:', error);
  }
};

/**
 * Reset temporary selections to default state
 */
export const resetTemporarySelections = (): TemporarySelections => {
  clearTemporarySelections();
  return defaultSelections;
};

/**
 * Check if temporary selections exist in localStorage
 */
export const hasTemporarySelections = (): boolean => {
  try {
    const savedSelections = localStorage.getItem(TEMP_SELECTIONS_KEY);
    if (!savedSelections) return false;
    
    const selections = JSON.parse(savedSelections);
    return Object.values(selections).some(value => value !== null);
  } catch (error) {
    console.error('[SelectionUtils] Failed to check selections:', error);
    return false;
  }
};

/**
 * Get the current selection level based on what has been selected
 */
export const getCurrentSelectionLevel = (selections: TemporarySelections): string | null => {
  if (selections.lessonId) return 'lesson';
  if (selections.subUnitId) return 'subUnit';
  if (selections.unitId) return 'unit';
  if (selections.subjectId) return 'subject';
  if (selections.classId) return 'class';
  return null;
};

/**
 * Check if a selection hierarchy is valid (no gaps in the chain)
 */
export const isValidSelectionHierarchy = (selections: TemporarySelections): boolean => {
  const { classId, subjectId, unitId, subUnitId, lessonId } = selections;
  
  // If no class is selected, everything else should be null
  if (!classId) {
    return !subjectId && !unitId && !subUnitId && !lessonId;
  }
  
  // If subject is selected, class should be selected
  if (subjectId && !classId) return false;
  
  // If unit is selected, class and subject should be selected
  if (unitId && (!classId || !subjectId)) return false;
  
  // If subUnit is selected, class, subject, and unit should be selected
  if (subUnitId && (!classId || !subjectId || !unitId)) return false;
  
  // If lesson is selected, class, subject, unit, and subUnit should be selected
  if (lessonId && (!classId || !subjectId || !unitId || !subUnitId)) return false;
  
  return true;
};

/**
 * Get a formatted display string for the current selections
 */
export const getSelectionsDisplayText = (
  selections: TemporarySelections,
  className?: string,
  subjectName?: string,
  unitName?: string,
  subUnitName?: string,
  lessonName?: string
): string => {
  const parts: string[] = [];
  
  if (className || selections.classId) {
    parts.push(className || 'Class');
  }
  
  if (subjectName || selections.subjectId) {
    parts.push(subjectName || 'Subject');
  }
  
  if (unitName || selections.unitId) {
    parts.push(unitName || 'Unit');
  }
  
  if (subUnitName || selections.subUnitId) {
    parts.push(subUnitName || 'SubUnit');
  }
  
  if (lessonName || selections.lessonId) {
    parts.push(lessonName || 'Chapter');
  }
  
  return parts.join(' > ') || 'No selections';
};

/**
 * Export selections for debugging or migration purposes
 */
export const exportSelections = (): string => {
  const selections = loadTemporarySelections();
  return JSON.stringify(selections, null, 2);
};

/**
 * Import selections from a JSON string
 */
export const importSelections = (jsonString: string): TemporarySelections => {
  try {
    const selections = JSON.parse(jsonString);
    const validated = { ...defaultSelections, ...selections };
    
    // Validate the imported selections
    if (!isValidSelectionHierarchy(validated)) {
      console.warn('[SelectionUtils] Invalid selection hierarchy, resetting to defaults');
      return defaultSelections;
    }
    
    saveTemporarySelections(validated);
    return validated;
  } catch (error) {
    console.error('[SelectionUtils] Failed to import selections:', error);
    return defaultSelections;
  }
};

/**
 * Create a selection from individual components
 */
export const createSelections = (
  classId?: string | null,
  subjectId?: string | null,
  unitId?: string | null,
  subUnitId?: string | null,
  lessonId?: string | null
): TemporarySelections => {
  const selections: TemporarySelections = {
    classId: classId || null,
    subjectId: subjectId || null,
    unitId: unitId || null,
    subUnitId: subUnitId || null,
    lessonId: lessonId || null
  };
  
  // Validate the created selections
  if (!isValidSelectionHierarchy(selections)) {
    console.warn('[SelectionUtils] Invalid selection hierarchy created');
    return defaultSelections;
  }
  
  return selections;
};