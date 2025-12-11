import React from 'react';
import { useTemporarySelections } from '../hooks/useTemporarySelections';
import { getSelectionsDisplayText } from '../utils/selectionUtils';

interface TemporarySelectionManagerProps {
  className?: string;
  showResetButton?: boolean;
  showStatus?: boolean;
  onSelectionChange?: (selections: any) => void;
}

/**
 * Component for managing temporary selections with reset functionality
 */
export const TemporarySelectionManager: React.FC<TemporarySelectionManagerProps> = ({
  className = '',
  showResetButton = true,
  showStatus = true,
  onSelectionChange
}) => {
  const {
    selections,
    resetSelections,
    hasSelections,
    getCurrentSelectionLevel
  } = useTemporarySelections();

  // Notify parent component of selection changes
  React.useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selections);
    }
  }, [selections, onSelectionChange]);

  const handleReset = () => {
    if (window.confirm('நீங்கள் உறுதியாக அனைத்து தேர்வுகளையும் அகற்ற விரும்புகிறீர்களா?')) {
      resetSelections();
    }
  };

  const currentLevel = getCurrentSelectionLevel();
  const hasAnySelections = hasSelections();

  if (!showStatus && !showResetButton) {
    return null;
  }

  return (
    <div className={`temporary-selection-manager ${className}`}>
      {showStatus && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                தற்காலிக தேர்வுகள்
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {hasAnySelections ? (
                  <>
                    <span className="font-medium">தற்போதைய நிலை:</span>{' '}
                    <span className="capitalize">
                      {currentLevel === 'class' && 'வகுப்பு தேர்வு செய்யப்பட்டது'}
                      {currentLevel === 'subject' && 'பாடம் தேர்வு செய்யப்பட்டது'}
                      {currentLevel === 'unit' && 'அலகு தேர்வு செய்யப்பட்டது'}
                      {currentLevel === 'subUnit' && 'துணை அலகு தேர்வு செய்யப்பட்டது'}
                      {currentLevel === 'lesson' && 'அத்தியாயம் தேர்வு செய்யப்பட்டது'}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500">எந்த தேர்வும் செய்யப்படவில்லை</span>
                )}
              </p>
              
              {hasAnySelections && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="grid grid-cols-2 gap-1">
                    <div>வகுப்பு: {selections.classId || '-'}</div>
                    <div>பாடம்: {selections.subjectId || '-'}</div>
                    <div>அலகு: {selections.unitId || '-'}</div>
                    <div>துணை அலகு: {selections.subUnitId || '-'}</div>
                    <div className="col-span-2">அத்தியாயம்: {selections.lessonId || '-'}</div>
                  </div>
                </div>
              )}
            </div>
            
            {showResetButton && hasAnySelections && (
              <button
                onClick={handleReset}
                className="ml-3 px-3 py-1 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded-md transition-colors duration-200"
                title="அனைத்து தேர்வுகளையும் அகற்ற"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TemporarySelectionManager;