import React from 'react';
import { UserRole } from '../types';

interface AdminSidebarProps {
  isOpen: boolean;
  activePage: string;
  setActivePage: (page: string) => void;
  userRole: UserRole;
}

const allManagementLinks = [
    { id: 'browser', label: 'Content Browser', roles: ['admin', 'teacher'] },
    { id: 'course-structure', label: 'Course Structure Management', roles: ['admin'] },
    { id: 'quiz-configuration', label: 'Quiz Configuration', roles: ['admin', 'teacher'] },
    { id: 'user-management', label: 'User Management', roles: ['admin'] },
    { id: 'collections-management', label: 'Database Management', roles: ['admin'] },
    { id: 'reports', label: 'Reports', roles: ['admin', 'teacher'] },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, activePage, setActivePage, userRole }) => {
  
  const visibleLinks = allManagementLinks.filter(link => link.roles.includes(userRole));

  return (
    <aside className={`flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${isOpen ? 'w-72' : 'w-0'} overflow-hidden shrink-0`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {userRole === 'admin' ? 'Admin Panel' : 'Editor Panel'}
            </h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            {visibleLinks.map(link => (
                <button
                    key={link.id}
                    onClick={() => setActivePage(link.id)}
                    className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activePage === link.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}
                >
                    {link.label}
                </button>
            ))}
        </nav>
    </aside>
  );
};