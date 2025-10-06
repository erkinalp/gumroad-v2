import { usePage } from "@inertiajs/react";
import React from "react";

import AdminUserAndProductsTabs from "$app/components/Admin/UserAndProductsTabs";
import User, { type User as UserType } from "$app/components/Admin/Users/User";

type PageProps = {
  user: UserType;
};

type Props = {
  is_affiliate_user?: boolean;
};

const AdminUsersShow = ({ is_affiliate_user = false }: Props) => {
  const { user } = usePage<PageProps>().props;

  return (
    <div className="paragraphs">
      <AdminUserAndProductsTabs selectedTab="users" user={user} />
      <User user={user} is_affiliate_user={is_affiliate_user} />
    </div>
  );
};

export default AdminUsersShow;
