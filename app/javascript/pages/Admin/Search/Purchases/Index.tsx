import { usePage } from "@inertiajs/react";
import React from "react";

import AdminPurchases, { type PageProps } from "$app/components/Admin/Purchases";

const AdminSearchPurchases = () => (
  <div className="space-y-4">
    <AdminPurchases {...(usePage().props as unknown as PageProps)} endpoint={Routes.admin_search_purchases_path} />
  </div>
);

export default AdminSearchPurchases;
