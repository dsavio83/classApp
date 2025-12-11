import React from 'react';
import { useApi } from '../hooks/useApi';
import * as api from '../services/api';
import { PlatformStats } from '../types';
import { RESOURCE_TYPES } from '../constants';
import { UsersIcon, CollectionIcon } from './icons/AdminIcons';
import { ActivityIcon } from './icons/ResourceTypeIcons'; // A generic content icon

const StatCard: React.FC<{
    title: string;
    value: number;
    Icon: React.FC<{ className?: string }>;
    color: string;
}> = ({ title, value, Icon, color }) => (
    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-md flex items-center">
        <div className={`p-3 rounded-full mr-4 ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">{value}</p>
        </div>
    </div>
);

export const ReportsPage: React.FC = () => {
    const { data: stats, isLoading, error } = useApi<PlatformStats>(api.getPlatformStats);

    if (isLoading) {
        return <div className="p-8 text-center">Loading reports...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">Error loading reports: {error.message}</div>;
    }

    if (!stats) {
        return <div className="p-8 text-center">No statistics available.</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white mb-6">Platform Reports</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard title="Total Users" value={stats.userCount} Icon={UsersIcon} color="bg-blue-500" />
                <StatCard title="Total Chapters" value={stats.lessonCount} Icon={CollectionIcon} color="bg-green-500" />
                <StatCard title="Total Content Items" value={stats.contentCount} Icon={ActivityIcon} color="bg-purple-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Course Structure Breakdown */}
                <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Course Structure</h2>
                    <ul className="space-y-3">
                        <li className="flex justify-between items-center text-sm"><span className="text-gray-600 dark:text-gray-300">Classes</span><span className="font-semibold text-gray-800 dark:text-white">{stats.classCount}</span></li>
                        <li className="flex justify-between items-center text-sm"><span className="text-gray-600 dark:text-gray-300">Subjects</span><span className="font-semibold text-gray-800 dark:text-white">{stats.subjectCount}</span></li>
                        <li className="flex justify-between items-center text-sm"><span className="text-gray-600 dark:text-gray-300">Units</span><span className="font-semibold text-gray-800 dark:text-white">{stats.unitCount}</span></li>
                        <li className="flex justify-between items-center text-sm"><span className="text-gray-600 dark:text-gray-300">Sub-Units</span><span className="font-semibold text-gray-800 dark:text-white">{stats.subUnitCount}</span></li>
                        <li className="flex justify-between items-center text-sm"><span className="text-gray-600 dark:text-gray-300">Chapters</span><span className="font-semibold text-gray-800 dark:text-white">{stats.lessonCount}</span></li>
                    </ul>
                </div>
                
                {/* User Breakdown */}
                <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">User Roles</h2>
                    <ul className="space-y-3">
                        <li className="flex justify-between items-center text-sm"><span className="text-gray-600 dark:text-gray-300">Administrators</span><span className="font-semibold text-gray-800 dark:text-white">{stats.adminCount}</span></li>
                        <li className="flex justify-between items-center text-sm"><span className="text-gray-600 dark:text-gray-300">Teachers</span><span className="font-semibold text-gray-800 dark:text-white">{stats.teacherCount}</span></li>
                        <li className="flex justify-between items-center text-sm border-t dark:border-gray-700 pt-3 mt-3"><span className="font-bold text-gray-700 dark:text-gray-200">Total Users</span><span className="font-bold text-lg text-gray-900 dark:text-white">{stats.userCount}</span></li>
                    </ul>
                </div>
            </div>

             {/* Content by Type */}
            <div className="mt-8 bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Content by Type</h2>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {RESOURCE_TYPES.map(({ key, label, Icon }) => (
                         <div key={key} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                            <Icon className="w-5 h-5 mr-3 text-blue-500" />
                            <span className="text-sm flex-1 text-gray-600 dark:text-gray-300">{label}</span>
                            <span className="text-sm font-semibold text-gray-800 dark:text-white">{stats.contentByType[key] || 0}</span>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};