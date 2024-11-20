"use client";

import { useState } from 'react';
import Image from 'next/image';

interface Stat {
    value: string | number;
    label: string;
}

interface Action {
    label: string;
    onClick: () => void;
    primary?: boolean;
}

interface ModernCardProps {
    title: string;
    subtitle?: string;
    content: React.ReactNode;
    imageUrl?: string;
    actions?: Action[];
    stats?: Stat[];
    expandable?: boolean;
    className?: string;
}

const ModernCard: React.FC<ModernCardProps> = ({ 
    title, 
    subtitle,
    content, 
    imageUrl, 
    actions,
    stats,
    expandable = false,
    className = ''
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md ${className}`}>
            {imageUrl && (
                <div className="relative aspect-w-16 aspect-h-9">
                    <Image 
                        src={imageUrl} 
                        alt={title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>
            )}
            
            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        {subtitle && (
                            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                        )}
                    </div>
                </div>

                {stats && stats.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mb-4 py-2 border-y border-gray-100">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                                <p className="text-xs text-gray-500">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className={`${expandable && !isExpanded ? 'line-clamp-3' : ''} prose prose-sm max-w-none`}>
                    {content}
                </div>

                {expandable && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="mt-2 text-sm font-medium text-green-600 hover:text-green-800 transition-colors"
                    >
                        {isExpanded ? 'Show less' : 'Show more'}
                    </button>
                )}

                {actions && actions.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {actions.map((action, index) => (
                            <button
                                key={index}
                                onClick={action.onClick}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    action.primary 
                                        ? 'bg-green-600 text-white hover:bg-green-700' 
                                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                                }`}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModernCard;
