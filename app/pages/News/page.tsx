"use client"
import { useEffect, useState } from 'react';
import Spinner from '../../Crud/Spinner';
import { useGlobalContextPost } from '../../Context/postStore';
import Continut from '../../Crud/GetAllPosts/page';

export default function Noutati() {
  const { data, loading, getAllPosts , error , clearData} = useGlobalContextPost();
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    //clear data

    clearData();
  
      loadMorePosts();
    
  }, []);


  useEffect(() => {
    const debouncedHandleScroll = debounce(handleScroll, 100);

    window.addEventListener('scroll', debouncedHandleScroll);
    return () => {
      window.removeEventListener('scroll', debouncedHandleScroll);
    };
  }, [page, loadingMore, hasMore]);

  const handleScroll = () => {
    if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || loadingMore || !hasMore) return;
    loadMorePosts();
  };

  const loadMorePosts = async () => {
    setLoadingMore(true);

    if (error === "No more posts") {
      setHasMore(false);
    } else {
      await getAllPosts(page);
      setPage(page + 1);
    }
    setLoadingMore(false);
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="container">
      <h1 className="mt-5 mb-4">Noutati:</h1>

      {data.length > 0 ? (
        <div>
          {data.map((data) => {
            return (
              <div key={data._id} className="mb-5 border-bottom pb-4">
                <Continut data={data} />
              </div>
            );
          })}
          {loadingMore && <Spinner />}
        </div>
      ) : (
        <h3 className="mb-5">Nu sa adaugat nici un continut pana acum</h3>
      )}
    </div>
  );
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}



