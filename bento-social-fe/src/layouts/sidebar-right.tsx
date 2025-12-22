import { usePathname } from 'next/navigation';
import React from 'react';

import { getPosts } from '@/apis/post';
import { followUser, getSuggestedUsers } from '@/apis/user';
import { useUserProfile } from '@/context/user-context';

import { IUserProfile } from '@/interfaces/user';
import { IPost } from '@/interfaces/post';
import { cn } from '@/lib/utils';

import { SplashScreen } from '@/components/loading-screen';
import ProfileCard from '@/components/profile-card/profile-card';
import ToggleGroup from '@/components/toggle-group/toggle-group';
import { TrendingPostCard } from '@/components/trending-post-card';
import { Typography } from '@/components/typography';

//-------------------------------------------------------------------------

type SidebarRightProps = {
  className?: string;
};

export default function SidebarRight({ className }: SidebarRightProps) {
  const [activeTab, setActiveTab] = React.useState('1');
  const pathName = usePathname();
  const [posts, setPosts] = React.useState<IPost[]>([]);
  const [suggestedUsers, setSuggestedUsers] = React.useState<IUserProfile[]>(
    []
  );
  const [followedIds, setFollowedIds] = React.useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = React.useState({
    posts: true,
    suggestions: true,
  });
  const [error, setError] = React.useState({ posts: '', suggestions: '' });
  const { userProfile } = useUserProfile();

  React.useEffect(() => {
    const fetchPostsData = async () => {
      setIsLoading((prev) => ({ ...prev, posts: true }));
      try {
        const params = { type: 'media', limit: 10 };
        const response = await getPosts(params);
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setError((prev) => ({ ...prev, posts: 'Failed to load posts.' }));
      } finally {
        setIsLoading((prev) => ({ ...prev, posts: false }));
      }
    };

    fetchPostsData();
  }, []);

  React.useEffect(() => {
    const fetchSuggestedUsers = async () => {
      if (activeTab !== '1' || !userProfile?.id) return;

      setIsLoading((prev) => ({ ...prev, suggestions: true }));
      try {
        const response = await getSuggestedUsers();
        setSuggestedUsers(response.data);
      } catch (error) {
        console.error('Error fetching suggested users:', error);
        setError((prev) => ({
          ...prev,
          suggestions: 'Failed to load suggestions.',
        }));
      } finally {
        setIsLoading((prev) => ({ ...prev, suggestions: false }));
      }
    };

    fetchSuggestedUsers();
  }, [activeTab, userProfile?.id]);

  const handleFollow = async (id: string) => {
    try {
      await followUser(id);
      setFollowedIds((prev) => new Set(prev).add(id));
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  };

  if (isLoading.posts) return <SplashScreen />;
  if (error.posts) return <div>{error.posts}</div>;

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  const isFollowingPage = pathName === '/following';

  return (
    <section
      className={cn(
        `bg-cushion h-screen relative z-10 w-85 2xl:w-120 transition-[width] duration-300 ease-in-out`,
        className
      )}
    >
      <div className="w-full h-full flex flex-col bg-surface-3 p-3 gap-3">
        {!isFollowingPage && (
          <ToggleGroup
            className="w-full p-1 flex justify-between items-center bg-neutral3-60 rounded-[6.25rem]"
            items={[
              { key: '1', label: 'Who to follow' },
              { key: '2', label: 'Trending posts' },
            ]}
            onChange={handleTabChange}
          />
        )}

        {isFollowingPage ? (
          <>
            <Typography
              level="title"
              className="text-tertiary opacity-80 px-3 py-[0.625rem]"
            >
              Trending Posts
            </Typography>
            {posts.map((post) => (
              <TrendingPostCard
                key={post.id}
                topic={post.topic}
                author={post.author}
                alt={post.id}
                content={post.content}
                image={post.image}
                time={post.createdAt}
              />
            ))}
          </>
        ) : (
          <>
            {activeTab === '1' ? (
              <div className="flex flex-col gap-2">
                {isLoading.suggestions ? (
                  <SplashScreen />
                ) : error.suggestions ? (
                  <div>{error.suggestions}</div>
                ) : suggestedUsers.length === 0 ? (
                  <div className="text-center text-tertiary py-4">
                    No suggestions available
                  </div>
                ) : (
                  suggestedUsers.map((user) => (
                    <ProfileCard
                      key={user.id}
                      user={{
                        id: user.id,
                        username: user.username,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        avatar: user.avatar ?? null,
                      }}
                      hasFollowedBack={followedIds.has(user.id)}
                      onFollow={() => handleFollow(user.id)}
                    />
                  ))
                )}
              </div>
            ) : (
              <ul className="max-h-[calc(100svh-68px)] overflow-y-scroll no-scrollbar">
                {posts.map((post) => (
                  <li key={post.id} className="mb-2">
                    <TrendingPostCard
                      topic={post.topic}
                      alt={post.id}
                      author={post.author}
                      image={post.image}
                      content={post.content}
                      time={post.createdAt}
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}
