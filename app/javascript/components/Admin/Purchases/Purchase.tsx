import React from "react";

import DateTimeWithRelativeTooltip from "$app/components/Admin/DateTimeWithRelativeTooltip";
import AdminPurchasesCreator from "$app/components/Admin/Purchases/Creator";
import AdminPurchasesHeader from "$app/components/Admin/Purchases/Header";
import { type Purchase } from "$app/components/Admin/Purchases/PurchaseDetails";
import AdminPurchasesRefundPolicy from "$app/components/Admin/Purchases/RefundPolicy";
import AdminPurchasesState from "$app/components/Admin/Purchases/State";

type Props = {
  purchase: Purchase;
};

const AdminPurchasesPurchase = ({ purchase }: Props) => (
  <tr>
    <td data-label="Purchase">
      <AdminPurchasesHeader purchase={purchase} />
      <AdminPurchasesState purchase={purchase} />
      <AdminPurchasesRefundPolicy purchase={purchase} />
    </td>

    <td data-label="By">
      <AdminPurchasesCreator purchase={purchase} />
      <small>
        <DateTimeWithRelativeTooltip date={purchase.created_at} />
      </small>
    </td>
  </tr>
);

export default AdminPurchasesPurchase;
