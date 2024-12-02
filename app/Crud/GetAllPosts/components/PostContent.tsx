'use client';

import Link from 'next/link';
import { Post } from '../../../types/api';

export function PostContent({ data }: { data: Post }): JSX.Element {
    // Format date consistently for both server and client
    const formatDate = (dateString: string | Date) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Date not available';
            }
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch {
            return 'Date not available';
        }
    };

    return (
        <article className="flex flex-col h-full">
            <div className="flex-grow space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                    {data.title}
                </h2>
                <div className="prose prose-sm text-gray-600">
                    {data.brief && data.brief.length > 200 ? (
                        <p className="line-clamp-3 leading-relaxed">{data.brief.slice(0, 200)}...</p>
                    ) : (
                        <p className="leading-relaxed">{data.brief}</p>
                    )}
                </div>
                <div className="text-sm text-gray-500 flex items-center">
                    <svg 
                        className="w-4 h-4 mr-2" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                    {formatDate(data.createdAt)}
                </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100">
                <Link 
                    href={`/Crud/GetAllPosts/SinglePost?post=${data.id}`}
                    className="block w-full"
                >
                    <button 
                        type="button" 
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg 
                                 hover:bg-blue-700 transition-all duration-300 
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                                 text-sm font-medium transform hover:scale-[1.02] active:scale-[0.98]
                                 shadow-sm hover:shadow flex items-center justify-center"
                    >
                        Read More
                        <svg 
                            className="w-4 h-4 ml-2" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth="2" 
                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                        </svg>
                    </button>
                </Link>
            </div>
        </article>
    );
}
