import React from 'react';
import { ResourceType, ResourceCounts } from '../types';
import { useApi } from '../hooks/useApi';
import { getCountsByLessonId } from '../services/api';
import { RESOURCE_TYPES } from '../constants';

interface ResourceIconStripProps {
  lessonId: string | null;
  selectedType: ResourceType | null;
  onSelectType: (type: ResourceType) => void;
}

export const ResourceIconStrip: React.FC<ResourceIconStripProps> = ({
  lessonId,
  selectedType,
  onSelectType,
}) => {
  const { data: counts } = useApi<ResourceCounts>(
    () => getCountsByLessonId(lessonId!),
    [lessonId],
    !!lessonId
  );

  return (
    <div className="flex flex-col gap-1">
      {RESOURCE_TYPES.map(r => {
        const count = counts?.[r.key] || 0;
        const isSelected = selectedType === r.key;
        return (
          <button
            key={r.key}
            onClick={() => onSelectType(r.key)}
            className={`w-full flex items-center justify-start text-left py-2 pr-2 rounded-r-md border-l-4 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-blue-500 ${
              isSelected
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 font-semibold pl-2'
                : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 pl-3'
            }`}
            title={`${r.label} (${count})`}
            aria-pressed={isSelected}
            disabled={!lessonId}
          >
            <r.Icon className="w-5 h-5 mr-3 shrink-0" />
            <span className="text-sm flex-1">{r.label}</span>
            {count > 0 && (
              <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-full">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
