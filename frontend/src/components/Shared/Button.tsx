import React, { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
    children, 
    variant = 'primary', 
    isLoading = false,
    className = '',
    disabled,
    ...props 
}) => {
    const baseClasses = "relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 overflow-hidden shadow-sm hover:shadow-md active:scale-95";
    
    const variants = {
        primary: "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 hover:shadow-indigo-500/30",
        secondary: "bg-white text-indigo-600 border border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 focus:ring-indigo-500",
        danger: "bg-rose-500 hover:bg-rose-600 text-white focus:ring-rose-400 hover:shadow-rose-500/30",
        ghost: "hover:bg-gray-100 text-gray-700 shadow-none hover:shadow-none bg-transparent"
    };

    return (
        <button 
            className={`${baseClasses} ${variants[variant]} ${disabled || isLoading ? 'opacity-60 cursor-not-allowed transform-none hover:shadow-none' : ''} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            <span className={isLoading ? 'opacity-80 flex items-center gap-2' : 'flex items-center gap-2'}>{children}</span>
        </button>
    );
};
