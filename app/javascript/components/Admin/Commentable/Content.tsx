import React from "react";

import Comment, { type CommentProps } from "$app/components/Admin/Commentable/Comment";
import Loading from "$app/components/Admin/Loading";

type AdminCommentableCommentsProps = {
  count: number;
  comments: CommentProps[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
};

const AdminCommentableComments = ({
  count,
  comments,
  isLoading,
  hasMore,
  onLoadMore,
}: AdminCommentableCommentsProps) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    hasMore && onLoadMore();
  };

  if (count === 0 && !isLoading)
    return (
      <div className="info" role="status">
        No comments created.
      </div>
    );

  return (
    <div>
      <h4 className="mb-2 font-bold">
        {comments.length} of {count === 1 ? "1 comment" : `${count} comments`}
      </h4>

      {hasMore ? (
        <button className="button small mb-4" onClick={handleClick} disabled={isLoading}>
          {isLoading ? "Loading..." : "Load more"}
        </button>
      ) : null}

      {isLoading ? <Loading /> : null}

      <div className="rows" role="list">
        {comments.map((comment) => (
          <Comment key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
};

export default AdminCommentableComments;
