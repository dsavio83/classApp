import React from 'react';
import { useTemporarySelections } from '../hooks/useTemporarySelections';
import { TemporarySelectionManager } from './TemporarySelectionManager';
import { EnhancedCascadeSelectors } from './EnhancedCascadeSelectors';
import { 
  saveTemporarySelections, 
  loadTemporarySelections, 
  hasTemporarySelections,
  exportSelections 
} from '../utils/selectionUtils';

/**
 * Test component to demonstrate and verify temporary selection system
 */
export const TemporarySelectionsDemo: React.FC = () => {
  const tempSelections = useTemporarySelections();

  const handleSaveCurrent = () => {
    saveTemporarySelections(tempSelections.selections);
    alert('Current selections saved to localStorage!');
  };

  const handleLoadSaved = () => {
    const saved = loadTemporarySelections();
    console.log('Loaded selections:', saved);
    alert(`Loaded selections. Check console for details.`);
  };

  const handleExportData = () => {
    const exported = exportSelections();
    console.log('Exported selections:', exported);
    
    // Create a downloadable file
    const blob = new Blob([exported], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'temporary-selections.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Selections exported and downloaded!');
  };

  const handleCheckStorage = () => {
    const hasData = hasTemporarySelections();
    const exported = exportSelections();
    
    console.log('Storage check:', {
      hasData,
      data: exported,
      localStorage: localStorage.getItem('learningPlatformTempSelections')
    });
    
    alert(`Storage check:\nHas data: ${hasData}\nCheck console for details.`);
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            தற்காலிக தேர்வு அமைப்பு பரிசோதனை
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This component demonstrates the temporary selection persistence system.
            Selections are stored in localStorage and persist across page refreshes.
          </p>
        </div>

        {/* Selection Manager */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            தேர்வு நிர்வாகி (Selection Manager)
          </h2>
          <TemporarySelectionManager
            showResetButton={true}
            showStatus={true}
            onSelectionChange={(selections) => {
              console.log('Selection manager updated:', selections);
            }}
          />
        </div>

        {/* Enhanced Cascade Selectors */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            மேம்படுத்தப்பட்ட தேர்வு சேனை (Enhanced Cascade Selectors)
          </h2>
          <EnhancedCascadeSelectors
            useTemporarySelections={true}
            showSelectionManager={false} // Already shown above
            onSyncToSession={false}
          />
        </div>

        {/* Test Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            பரிசோதனை கட்டுப்பாடுகள் (Test Controls)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={handleSaveCurrent}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
            >
              Save Current
            </button>
            
            <button
              onClick={handleLoadSaved}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors duration-200"
            >
              Load Saved
            </button>
            
            <button
              onClick={handleExportData}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors duration-200"
            >
              Export Data
            </button>
            
            <button
              onClick={handleCheckStorage}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors duration-200"
            >
              Check Storage
            </button>
          </div>
        </div>

        {/* Current State Display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            தற்போதைய நிலை (Current State)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Hook State
              </h3>
              <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md text-sm overflow-auto">
                {JSON.stringify(tempSelections.selections, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Storage State
              </h3>
              <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md text-sm overflow-auto">
                {JSON.stringify(loadTemporarySelections(), null, 2)}
              </pre>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 dark:text-gray-400">Has Selections:</span>
              <span className={`font-medium ${tempSelections.hasSelections() ? 'text-green-600' : 'text-red-600'}`}>
                {tempSelections.hasSelections() ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 dark:text-gray-400">Current Level:</span>
              <span className="font-medium text-blue-600">
                {tempSelections.getCurrentSelectionLevel() || 'None'}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 dark:text-gray-400">Storage Has Data:</span>
              <span className={`font-medium ${hasTemporarySelections() ? 'text-green-600' : 'text-red-600'}`}>
                {hasTemporarySelections() ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            பரிசோதனை வழிமுறைகள் (Test Instructions)
          </h3>
          <ul className="text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Select class, subject, unit, subunit, and chapter using the selectors above</li>
            <li>• Refresh the page - selections should persist</li>
            <li>• Click "Reset" button to clear all selections</li>
            <li>• Use "Save Current" to save to localStorage manually</li>
            <li>• Use "Load Saved" to load from localStorage</li>
            <li>• Check browser DevTools → Application → Local Storage for 'learningPlatformTempSelections'</li>
            <li>• Use "Export Data" to download selections as JSON</li>
            <li>• Use "Check Storage" to debug storage state</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TemporarySelectionsDemo;