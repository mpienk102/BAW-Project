import React, { type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({ 
    label, 
    error, 
    className = '', 
    id, 
    ...props 
}) => {
    const inputId = id || Math.random().toString(36).substring(7);

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={`
                    w-full px-4 py-2.5 rounded-xl border bg-white text-gray-900 
                    placeholder-gray-400 transition-all duration-200 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
                    hover:border-indigo-300 shadow-sm
                    ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : 'border-gray-200'}
                    ${props.disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}
                `}
                {...props}
            />
            {error && <span className="text-xs text-red-500 mt-0.5 animate-pulse">{error}</span>}
        </div>
    );
};
