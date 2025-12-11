import React from 'react';
import { useSession } from '../context/SessionContext';
import { FontIncreaseIcon, FontDecreaseIcon } from './icons/AdminIcons';
import { FontSize } from '../types';

// Define available font sizes in pixels
const FONT_SIZES: FontSize[] = [10, 12, 14, 16, 18, 20, 24, 28, 32];

export const FontSizeControl: React.FC = () => {
    const { session, setFontSize } = useSession();
    
    const adjustFontSize = (direction: 'up' | 'down') => {
        // Find closest index in case the current size isn't exactly in the array
        // (though it should be, this is safer for migrations)
        let currentIndex = FONT_SIZES.findIndex(size => size === session.fontSize);
        if (currentIndex === -1) {
             // If not found, find closest
             const closest = FONT_SIZES.reduce((prev, curr) => 
                Math.abs(curr - session.fontSize) < Math.abs(prev - session.fontSize) ? curr : prev
             );
             currentIndex = FONT_SIZES.indexOf(closest);
        }

        let newIndex = direction === 'up' ? currentIndex + 1 : currentIndex - 1;
        
        // Clamp
        if (newIndex < 0) newIndex = 0;
        if (newIndex >= FONT_SIZES.length) newIndex = FONT_SIZES.length - 1;
        
        if (newIndex !== currentIndex) {
            setFontSize(FONT_SIZES[newIndex]);
        }
    };

    return (
        <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mr-2 h-9">
            <button 
                onClick={() => adjustFontSize('down')} 
                disabled={session.fontSize <= FONT_SIZES[0]} 
                className="px-2 h-full rounded-l-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 transition-colors flex items-center justify-center w-9" 
                title="Decrease Font Size"
            >
                <FontDecreaseIcon className="w-4 h-4" />
            </button>
            
            <div className="px-3 h-full flex items-center justify-center min-w-[3.5rem] text-xs font-mono font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900">
                {session.fontSize}px
            </div>

            <button 
                onClick={() => adjustFontSize('up')} 
                disabled={session.fontSize >= FONT_SIZES[FONT_SIZES.length - 1]} 
                className="px-2 h-full rounded-r-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 text-gray-600 dark:text-gray-300 border-l border-gray-200 dark:border-gray-700 transition-colors flex items-center justify-center w-9" 
                title="Increase Font Size"
            >
                 <FontIncreaseIcon className="w-4 h-4" />
            </button>
        </div>
    );
};