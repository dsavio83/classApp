import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckIcon, AlertIcon, InfoIcon, WarningIcon, CloseIcon } from '../components/icons/ToastIcons';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            removeToast(id);
        }, 3000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* 
                Updated z-index to z-[9999] to ensure toasts always appear on top of 
                full-screen modals (like PDF viewers) which usually use z-50.
            */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
    const icons = {
        success: <CheckIcon className="w-5 h-5 text-green-500" />,
        error: <AlertIcon className="w-5 h-5 text-red-500" />,
        warning: <WarningIcon className="w-5 h-5 text-yellow-500" />,
        info: <InfoIcon className="w-5 h-5 text-blue-500" />,
    };

    const bgColors = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        warning: 'bg-yellow-50 border-yellow-200',
        info: 'bg-blue-50 border-blue-200',
    };

    return (
        <div className={`pointer-events-auto flex items-center w-full max-w-xs p-4 rounded-lg shadow-lg border ${bgColors[toast.type]} transform transition-all duration-300 ease-in-out animate-slide-in`}>
            <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg bg-white">
                {icons[toast.type]}
            </div>
            <div className="ml-3 text-sm font-normal text-gray-800">{toast.message}</div>
            <button
                onClick={onClose}
                className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8"
                aria-label="Close"
            >
                <CloseIcon className="w-3 h-3" />
            </button>
        </div>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};