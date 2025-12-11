import React, { useState } from 'react';
import { XIcon } from './icons/AdminIcons';

interface ResolutionOption {
  label: string;
  value: string;
  description: string;
}

interface ResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResolutionSelect: (resolution: string) => void;
}

const resolutionOptions: ResolutionOption[] = [
  {
    label: 'Mobile (360px)',
    value: 'mobile',
    description: 'Optimized for mobile devices'
  },
  {
    label: 'Tablet (768px)', 
    value: 'tablet',
    description: 'Optimized for tablets'
  },
  {
    label: 'Desktop (1024px)',
    value: 'desktop',
    description: 'Optimized for desktop displays'
  },
  {
    label: 'Large Desktop (1440px)',
    value: 'large',
    description: 'Optimized for large screens'
  }
];

export const ResolutionModal: React.FC<ResolutionModalProps> = ({
  isOpen,
  onClose,
  onResolutionSelect
}) => {
  const [selectedResolution, setSelectedResolution] = useState<string>('');

  const handleSave = () => {
    if (selectedResolution) {
      onResolutionSelect(selectedResolution);
      onClose();
    }
  };

  const handleRadioChange = (value: string) => {
    setSelectedResolution(value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-900 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Page Resolution
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Resolution Options */}
          <div className="space-y-4">
            {resolutionOptions.map((option) => (
              <div key={option.value} className="flex items-start space-x-3">
                <div className="flex items-center h-5">
                  <input
                    id={option.value}
                    name="resolution"
                    type="radio"
                    value={option.value}
                    checked={selectedResolution === option.value}
                    onChange={(e) => handleRadioChange(e.target.value)}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div className="flex-1">
                  <label 
                    htmlFor={option.value}
                    className="block text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                  >
                    {option.label}
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {option.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedResolution}
            >
              Apply Resolution
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};