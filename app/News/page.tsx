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
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-5xl font-bold mb-16 text-gray-800 text-center">
        {t('Latest in our newsfeed:')}
      </h1>
      
      {data.length > 0 ? (
        <div className="space-y-12">
          {data.map((data) => (
            <article 
              key={data.id} 
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300
                       border border-gray-100"
            >
              {data.imageUrl && (
                <div className="w-full h-[400px] relative rounded-t-lg overflow-hidden">
                  <img 
                    src={data.imageUrl} 
                    alt={data.title} 
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              <div className="p-8">
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <time>{new Date(data.createdAt).toLocaleDateString()}</time>
                  {data.author && (
                    <>
                      <span>•</span>
                      <span>{data.author}</span>
                    </>
                  )}
                </div>
                <PostContent data={data} />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-gray-50 rounded-lg">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 mb-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <h3 className="text-3xl font-semibold text-gray-800 mb-3">{t('No articles yet')}</h3>
          <p className="text-gray-600 text-lg">{t('Check back later for updates and news.')}</p>
        </div>
      )}
      
      {loadingMore && (
        <div className="flex justify-center mt-12">
          <Spinner />
        </div>
      )}
    </div>
  );
}
