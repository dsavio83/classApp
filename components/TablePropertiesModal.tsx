import React, { useState } from 'react';
import { XIcon } from './icons/AdminIcons';

interface TablePropertiesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyProperties: (properties: TableProperties) => void;
}

export interface TableProperties {
    backgroundColor: string;
    borderColor: string;
    borderWidth: string;
    cellPadding: string;
    textAlign: 'left' | 'center' | 'right';
    headerBackgroundColor: string;
}

export const TablePropertiesModal: React.FC<TablePropertiesModalProps> = ({ 
    isOpen, 
    onClose, 
    onApplyProperties 
}) => {
    const [properties, setProperties] = useState<TableProperties>({
        backgroundColor: '#ffffff',
        borderColor: '#666666',
        borderWidth: '1px',
        cellPadding: '10px',
        textAlign: 'left',
        headerBackgroundColor: '#f0f0f0'
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onApplyProperties(properties);
        onClose();
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleOverlayClick}
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                        Table Properties
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                        <XIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Background Color
                            </label>
                            <input
                                type="color"
                                value={properties.backgroundColor}
                                onChange={(e) => setProperties({...properties, backgroundColor: e.target.value})}
                                className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Header Background
                            </label>
                            <input
                                type="color"
                                value={properties.headerBackgroundColor}
                                onChange={(e) => setProperties({...properties, headerBackgroundColor: e.target.value})}
                                className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Border Color
                            </label>
                            <input
                                type="color"
                                value={properties.borderColor}
                                onChange={(e) => setProperties({...properties, borderColor: e.target.value})}
                                className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Border Width
                            </label>
                            <select
                                value={properties.borderWidth}
                                onChange={(e) => setProperties({...properties, borderWidth: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="1px">1px</option>
                                <option value="2px">2px</option>
                                <option value="3px">3px</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Cell Padding
                            </label>
                            <select
                                value={properties.cellPadding}
                                onChange={(e) => setProperties({...properties, cellPadding: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="5px">5px</option>
                                <option value="8px">8px</option>
                                <option value="10px">10px</option>
                                <option value="12px">12px</option>
                                <option value="15px">15px</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Text Align
                            </label>
                            <select
                                value={properties.textAlign}
                                onChange={(e) => setProperties({...properties, textAlign: e.target.value as 'left' | 'center' | 'right'})}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Apply Properties
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};