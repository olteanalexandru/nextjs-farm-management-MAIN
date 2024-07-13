import debounce from './debounce';

export const handleScroll = (loadMorePosts) => {
  if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || loadingMore || !hasMore) return;
  loadMorePosts();
};

export const loadMorePosts = async (setLoadingMore, error, getAllPosts, page, setPage, setHasMore) => {
  setLoadingMore(true);

  if (error === "No more posts") {
    console.log("erarea" + error)
    setHasMore(false);
  } else {
    await getAllPosts(page);
    setPage(page + 1);
  }
  setLoadingMore(false);
};
