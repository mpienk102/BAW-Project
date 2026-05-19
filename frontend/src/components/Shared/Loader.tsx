import React from 'react';

export const Loader: React.FC = () => {
    return (
        <div className="flex items-center justify-center py-20">
            <div className="relative w-16 h-16">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute top-2 left-2 w-12 h-12 border-4 border-purple-200 border-b-purple-600 rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>
            </div>
        </div>
    );
};
