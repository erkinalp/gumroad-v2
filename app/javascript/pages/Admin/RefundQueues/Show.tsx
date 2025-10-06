import { usePage, WhenVisible } from "@inertiajs/react";
import React from "react";

import { type Pagination } from "$app/hooks/useLazyFetch";

import EmptyState from "$app/components/Admin/EmptyState";
import Loading from "$app/components/Admin/Loading";
import RefundableUser, { type User } from "$app/components/Admin/Users/User";

type Props = {
  users: User[];
  pagination: Pagination;
};

const AdminRefundQueue = () => {
  const { users, pagination } = usePage<Props>().props;

  const RenderNextUsersWhenVisible = () => {
    const usersLengthFromCurrentPage = users.length / pagination.page;

    if (usersLengthFromCurrentPage >= pagination.limit) {
      const params = {
        data: { page: pagination.page + 1 },
        only: ["users", "pagination"],
        preserveScroll: true,
      };

      return <WhenVisible fallback={<Loading />} params={params} children />;
    }
  };

  return (
    <section className="flex flex-col gap-4">
      {users.map((user) => (
        <RefundableUser key={user.id} user={user} is_affiliate_user={false} />
      ))}
      {pagination.page === 1 && users.length === 0 && <EmptyState message="No users found." />}
      <RenderNextUsersWhenVisible />
    </section>
  );
};

export default AdminRefundQueue;
