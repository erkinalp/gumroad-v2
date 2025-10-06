import React from "react";

import DateTimeWithRelativeTooltip from "$app/components/Admin/DateTimeWithRelativeTooltip";
import type { Purchase } from "$app/components/Admin/Purchases/PurchaseDetails";
import { NoIcon } from "$app/components/Icons";

type AdminPurchasesFooterProps = {
  purchase: Purchase;
};

const AdminPurchasesFooter = ({ purchase }: AdminPurchasesFooterProps) => (
  <dl>
    <dt>Updated</dt>
    <dd>
      <DateTimeWithRelativeTooltip date={purchase.updated_at} />
    </dd>
    <dt>Deleted</dt>
    <dd>
      <DateTimeWithRelativeTooltip date={purchase.deleted_at} placeholder={<NoIcon />} />
    </dd>
  </dl>
);

export default AdminPurchasesFooter;
