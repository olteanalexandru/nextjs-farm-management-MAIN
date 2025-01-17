import debounce from './debounce';

export const handleScroll = (loadMorePosts, loadingMore, hasMore) => {
  if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || loadingMore || !hasMore) return;
  loadMorePosts();
};

export const loadMorePosts = async (setLoadingMore, error, getAllPosts, page, setPage, setHasMore) => {
  setLoadingMore(true);

  if (error === "No more posts") {
    console.log(" no more posts " + error)
    setHasMore(false);
  } else {
    await getAllPosts(page);
    setPage(page + 1);
  }
  setLoadingMore(false);
};
