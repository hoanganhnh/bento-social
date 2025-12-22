/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';

import { IPost } from '@/interfaces/post';

import { useUserProfile } from '@/context/user-context';
import eventBus from '@/utils/event-emitter';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { AddIcon } from '@/components/icons';
import { SplashScreen } from '@/components/loading-screen';
import { ComposerInput, NewPostModal } from '@/components/new-post';
import { Post } from '@/components/post';
import SearchInput from '@/components/search-input/search-input';
import MobileSidebarTrigger from '@/components/sidebar-trigger/mobile-sidebar-trigger';
import { usePost } from '@/context/post-context';

import { USER_AVATAR_PLACEHOLDER } from '@/constant';

// ----------------------------------------------------------------------

export default function HomeView() {
  const { posts, isLoading, isLoadingMore, setFilter, loadMore, hasMore } =
    usePost();
  const [searchStr, setSearchStr] = React.useState<string>('');
  const [isSidebarShow, setIsSidebarShow] = React.useState<boolean>(false);
  const [isCreatePost, setIsCreatePost] = React.useState<boolean>(false);
  const [isDeleted, setIsDeleted] = React.useState<boolean>(false);
  const [openMoreOptionsId, setOpenMoreOptionsId] = React.useState<
    string | null
  >(null);

  const { userProfile: user } = useUserProfile();

  React.useEffect(() => {
    setFilter((prevFilter) => ({ ...prevFilter, str: searchStr }));
  }, [searchStr, setFilter, isDeleted]);

  React.useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isCreatePost) {
        setIsCreatePost(false);
      }
    };

    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isCreatePost]);

  if (isLoading || !user) return <SplashScreen />;

  const toggleSidebar = () => {
    setIsSidebarShow(!isSidebarShow);
    eventBus.emit('isShowSidebar', !isSidebarShow);
  };

  const currentUser = user && {
    fullname: `${user.firstName} ${user.lastName}`,
    nickname: user.username,
    avatar: user.avatar || USER_AVATAR_PLACEHOLDER,
  };

  const handleCreatePost = () => {
    setIsCreatePost(!isCreatePost);
  };

  return (
    <>
      <div className="h-fit min-h-screen overflow-y-scroll p-3 no-scrollbar pb-[5rem]">
        <div className="flex items-center gap-2 mb-3">
          <SearchInput
            placeholder="Search for posts"
            search={searchStr}
            setSearch={setSearchStr}
          />
          <Button
            onClick={() => {
              handleCreatePost();
            }}
            child={<AddIcon />}
            className="size-[44px] min-w-[44px]"
          />
          <MobileSidebarTrigger className="md:hidden" onClick={toggleSidebar}>
            <Avatar src={currentUser.avatar} alt={currentUser.nickname} />
          </MobileSidebarTrigger>
        </div>
        <ComposerInput usedBy="post" className="relative" />
        <ul className="h-fit mt-3 ">
          {posts.map((post: IPost) => (
            <li key={post.id} className="mb-2">
              <Post
                data={post}
                onDeleteSuccess={setIsDeleted}
                openMoreOptionsId={openMoreOptionsId}
                setOpenMoreOptionsId={setOpenMoreOptionsId}
              />
            </li>
          ))}
        </ul>

        {/* Load More Button */}
        {hasMore && posts.length > 0 && (
          <div className="flex justify-center mt-4 mb-8">
            <Button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="px-6 py-3 rounded-full"
              child={
                isLoadingMore ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <span>Load more posts</span>
                )
              }
            />
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <div className="text-center text-tertiary py-4 opacity-60">
            No more posts to load
          </div>
        )}
      </div>
      {isCreatePost && <NewPostModal onBack={handleCreatePost} />}
    </>
  );
}
