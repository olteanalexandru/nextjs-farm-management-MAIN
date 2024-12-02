"use client";
import { useEffect, useState } from 'react';
import Spinner from '../Crud/Spinner';
import { usePostContext } from '../providers/postStore';
import { PostContent } from '../components/PostContent';
import { handleScroll, loadMorePosts } from './Components/scrollHandler';
import debounce from './Components/debounce';
import { useTranslations } from 'next-intl';

export default function Noutati() {
  const { data, loading, getAllPosts, error, clearData } = usePostContext();
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const t = useTranslations('News');

  useEffect(() => {
    const fetchData = async () => {
      clearData();
      await loadMorePosts(setLoadingMore, error, getAllPosts, page, setPage, setHasMore);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const debouncedHandleScroll = debounce(() => {
      handleScroll(
        () => loadMorePosts(setLoadingMore, error, getAllPosts, page, setPage, setHasMore),
        loadingMore,
        hasMore
      );
    }, 100);
    
    window.addEventListener('scroll', debouncedHandleScroll);
    return () => {
      window.removeEventListener('scroll', debouncedHandleScroll);
    };
  }, [page, loadingMore, hasMore, error]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-gray-600">Loading news...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <h1 className="text-4xl font-bold mb-12 text-gray-800 border-b pb-4">
        {t('Latest in our newsfeed:')}
      </h1>
      
      {data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.map((data) => (
            <div 
              key={data.id} 
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 
                       transform hover:-translate-y-1"
            >
              <div className="p-6 h-full flex flex-col">
                <PostContent data={data} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">No news yet</h3>
          <p className="text-gray-600">Check back later for updates and news.</p>
        </div>
      )}
      
      {loadingMore && (
        <div className="flex justify-center mt-8">
          <Spinner />
        </div>
      )}
    </div>
  );
}
