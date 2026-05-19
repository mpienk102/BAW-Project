import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    glass?: boolean;
    onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ 
    children, 
    className = '',
    glass = false,
    onClick
}) => {
    return (
        <div 
            onClick={onClick}
            className={`
                rounded-2xl overflow-hidden transition-all duration-300
                ${glass ? 'glass' : 'bg-white shadow-md border border-gray-100'}
                ${onClick ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : ''}
                ${className}
            `}
        >
            {children}
        </div>
    );
};
