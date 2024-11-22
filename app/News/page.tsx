"use client";
import { useEffect, useState } from 'react';
import Spinner from '../Crud/Spinner';
import { usePostContext } from '../providers/postStore'; // Corrected import
import Continut from '../Crud/GetAllPosts/page';
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
    return <Spinner />;
  }

  return (
    <div className="container">
      <h1 className="mt-5 mb-4">Our latest news:</h1>
      {data.length > 0 ? (
        <div>
          {data.map((data) => {
            return (
              <div key={data.id} className="mb-5 border-bottom pb-4">
                <Continut data={data} />
              </div>
            );
          })}
          {loadingMore && <Spinner />}
        </div>
      ) : (
        <h3 className="mb-5">Nothing to see at the moment</h3>
      )}
    </div>
  );
}



