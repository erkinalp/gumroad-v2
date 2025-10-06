import { usePage } from "@inertiajs/react";
import React from "react";

import AdminPurchases, { type PageProps } from "$app/components/Admin/Purchases";

const AdminComplianceCards = () => {
  const props = usePage().props as unknown as PageProps;
  return (
    <div className="space-y-4">
      <AdminPurchases {...props} endpoint={Routes.admin_cards_path} />
    </div>
  );
};

export default AdminComplianceCards;
