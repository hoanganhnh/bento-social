'use client';
import { getPosts } from '@/apis/post';
import { IPost } from '@/interfaces/post';
import React from 'react';

//--------------------------------------------------------------------------------------------
interface PostContextType {
  posts: IPost[];
  filter: FilterType;
  setFilter: React.Dispatch<React.SetStateAction<FilterType>>;
  addPost: (newPost: IPost) => void;
  updatePostCtx: (updatedPost: IPost) => void;
  setPosts: (posts: IPost[]) => void;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  refreshPosts: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  page: number;
}

interface FilterType {
  str?: string;
  limit?: number;
  page?: number;
  userId?: string;
  type?: string;
}

const DEFAULT_LIMIT = 10;

const PostContext = React.createContext<PostContextType | undefined>(undefined);

function usePostsManager(initialFilter: FilterType) {
  const [posts, setPosts] = React.useState<IPost[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState<boolean>(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [filter, setFilter] = React.useState<FilterType>({
    ...initialFilter,
    limit: DEFAULT_LIMIT,
  });
  const [page, setPage] = React.useState<number>(1);
  const [hasMore, setHasMore] = React.useState<boolean>(true);

  const fetchPosts = React.useCallback(async () => {
    setIsLoading(true);
    setPage(1);
    try {
      const response = await getPosts({ ...filter, page: 1 });
      setPosts(response.data);
      setHasMore(response.data.length >= (filter.limit || DEFAULT_LIMIT));
      setError(null);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError(new Error('Failed to fetch posts'));
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  const loadMore = React.useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      const response = await getPosts({ ...filter, page: nextPage });
      if (response.data.length > 0) {
        setPosts((prevPosts) => [...prevPosts, ...response.data]);
        setPage(nextPage);
        setHasMore(response.data.length >= (filter.limit || DEFAULT_LIMIT));
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [filter, page, isLoadingMore, hasMore]);

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const addPost = (newPost: IPost) => {
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  };

  const updatePostCtx = (updatedPost: IPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => (post.id === updatedPost.id ? updatedPost : post))
    );
  };

  return {
    posts,
    filter,
    setFilter,
    addPost,
    updatePostCtx,
    setPosts,
    isLoading,
    isLoadingMore,
    error,
    refreshPosts: fetchPosts,
    loadMore,
    hasMore,
    page,
  };
}

export function PostProvider({ children }: { children: React.ReactNode }) {
  const postManager = usePostsManager({});

  return (
    <PostContext.Provider value={postManager}>{children}</PostContext.Provider>
  );
}

export function usePost() {
  const context = React.useContext(PostContext);
  if (context === undefined) {
    throw new Error('usePost must be used within a PostProvider');
  }
  return context;
}
