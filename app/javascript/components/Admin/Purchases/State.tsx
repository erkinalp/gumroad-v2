import { capitalize } from "lodash";
import React from "react";

import AdminPurchasesErrorCode from "$app/components/Admin/Purchases/ErrorCode";
import { type Purchase } from "$app/components/Admin/Purchases/PurchaseDetails";

const AdminPurchasesState = ({ purchase }: { purchase: Purchase }) => (
  <ul className="inline">
    <li>{capitalize(purchase.purchase_state)}</li>
    {purchase.stripe_refunded ? <li>(refunded)</li> : null}
    {purchase.stripe_partially_refunded ? <li>(partially refunded)</li> : null}
    {purchase.chargedback_not_reversed ? <li>(chargeback)</li> : null}
    {purchase.chargeback_reversed ? <li>(chargeback reversed)</li> : null}
    {purchase.error_code ? (
      <li>
        <AdminPurchasesErrorCode purchase={purchase} />
      </li>
    ) : null}
  </ul>
);

export default AdminPurchasesState;
