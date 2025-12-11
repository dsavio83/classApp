import React from 'react';
import { ResourceType } from '../types';
import { ResourceIconStrip } from './ResourceIconStrip';

interface SidebarProps {
  lessonId: string | null;
  selectedResourceType: ResourceType | null;
  onSelectResourceType: (type: ResourceType) => void;
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  lessonId,
  selectedResourceType, 
  onSelectResourceType,
  isOpen 
}) => {
  return (
    <aside className={`flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${isOpen ? 'w-72' : 'w-0'} overflow-hidden`}>
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Resources</h2>
        <ResourceIconStrip
          lessonId={lessonId}
          selectedType={selectedResourceType}
          onSelectType={onSelectResourceType}
        />
      </div>
    </aside>
  );
};
