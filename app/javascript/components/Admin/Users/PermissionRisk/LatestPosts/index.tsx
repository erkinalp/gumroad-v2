import React from "react";
import { cast } from "ts-safe-cast";

import { useLazyFetch } from "$app/hooks/useLazyFetch";

import Loading from "$app/components/Admin/Loading";
import Post, { type PostProps } from "$app/components/Admin/Users/PermissionRisk/LatestPosts/Post";
import type { User } from "$app/components/Admin/Users/User";

type LatestPostsProps = {
  user: User;
};

const LatestPostsContent = ({ posts, isLoading }: { posts: PostProps[]; isLoading: boolean }) => {
  if (isLoading) return <Loading />;
  if (posts.length > 0)
    return (
      <div className="stack">
        {posts.map(({ id, name, created_at }) => (
          <Post key={id} id={id} name={name} created_at={created_at} />
        ))}
      </div>
    );
  return (
    <div className="info" role="status">
      No posts created.
    </div>
  );
};

const LastestPosts = ({ user }: LatestPostsProps) => {
  const [open, setOpen] = React.useState(false);

  const {
    data: posts,
    isLoading,
    fetchData: fetchPosts,
  } = useLazyFetch<PostProps[]>([], {
    url: Routes.admin_user_latest_posts_path(user.id, { format: "json" }),
    responseParser: (data) => {
      const { posts } = cast<{ posts: PostProps[] }>(data);
      return posts;
    },
  });

  const onToggle = (e: React.MouseEvent<HTMLDetailsElement>) => {
    setOpen(e.currentTarget.open);
    if (e.currentTarget.open) {
      fetchPosts();
    }
  };

  return (
    <>
      <hr />
      <details open={open} onToggle={onToggle}>
        <summary>
          <h3>Last posts</h3>
        </summary>
        <LatestPostsContent posts={posts} isLoading={isLoading} />
      </details>
    </>
  );
};

export default LastestPosts;
