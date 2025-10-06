import { usePage } from "@inertiajs/react";
import React from "react";

import AdminPurchases, { type PageProps } from "$app/components/Admin/Purchases";

const AdminSearchPurchases = () => {
  const props = usePage().props as unknown as PageProps;
  return (
    <div className="space-y-4">
      <AdminPurchases {...props} endpoint={Routes.admin_search_purchases_path} />
    </div>
  );
};

export default AdminSearchPurchases;
