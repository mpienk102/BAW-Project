import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ 
    isOpen, 
    onClose, 
    title,
    children 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-gray-900/60 transition-opacity backdrop-blur-sm"
                onClick={onClose}
            ></div>
            
            {/* Dialog Panel */}
            <div 
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all scale-100 opacity-100 animate-in fade-in zoom-in duration-200"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                        {title}
                    </h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors focus:outline-none"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                {/* Content */}
                <div className="px-6 py-6">
                    {children}
                </div>
            </div>
        </div>
    );
};
