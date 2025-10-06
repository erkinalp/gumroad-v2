import { Link } from "@inertiajs/react";
import React from "react";

import { type User as UserType } from "$app/components/Admin/Users/User";
import Tab from "$app/components/Tabs/Tab";
import TabList from "$app/components/Tabs/TabList";

type Props = {
  selectedTab: string;
  user: UserType;
  is_affiliate_user?: boolean;
};

const AdminUserAndProductsTabs = ({ selectedTab, user, is_affiliate_user = false }: Props) => {
  const userPath = is_affiliate_user ? Routes.admin_affiliate_path(user.id) : Routes.admin_user_path(user.id);
  const productsPath = is_affiliate_user
    ? Routes.admin_affiliate_products_path(user.id)
    : Routes.admin_user_products_path(user.id);
  return (
    <TabList>
      <Tab isSelected={selectedTab === "users"}>
        <Link href={userPath} prefetch className="block p-3 no-underline">
          Profile
        </Link>
      </Tab>
      <Tab isSelected={selectedTab === "products"}>
        <Link href={productsPath} prefetch className="block p-3 no-underline">
          Products
        </Link>
      </Tab>
    </TabList>
  );
};

export default AdminUserAndProductsTabs;
