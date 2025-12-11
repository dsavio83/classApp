
import React from 'react';

interface ManagementPageProps {
  title: string;
}

const toTitleCase = (str: string) => {
    return str.replace(/-/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

export const ManagementPage: React.FC<ManagementPageProps> = ({ title }) => {
  return (
    <div className="p-8 h-full flex items-center justify-center">
        <div className="text-center bg-white dark:bg-gray-800/50 p-10 rounded-lg shadow-md">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white mb-4">{toTitleCase(title)}</h1>
            <p className="text-gray-500 dark:text-gray-400">This is the placeholder page for managing {toTitleCase(title).toLowerCase()}.</p>
            <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Functionality for this section will be implemented here.</p>
        </div>
    </div>
  );
};
