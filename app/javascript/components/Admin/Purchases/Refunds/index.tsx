import React from "react";

import { type Purchase } from "$app/components/Admin/Purchases/PurchaseDetails";
import AdminPurchasesRefund from "$app/components/Admin/Purchases/Refunds/Refund";

const AdminPurchasesRefunds = ({ purchase }: { purchase: Purchase }) => (
  <div>
    <ul>
      {purchase.refunds.map((refund) => (
        <AdminPurchasesRefund key={refund.id} refund={refund} />
      ))}
    </ul>
  </div>
);

export default AdminPurchasesRefunds;
