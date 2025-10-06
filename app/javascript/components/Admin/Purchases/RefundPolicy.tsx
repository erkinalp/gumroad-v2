import React from "react";

import { type Purchase } from "$app/components/Admin/Purchases/PurchaseDetails";
import { Icon } from "$app/components/Icons";
import { WithTooltip } from "$app/components/WithTooltip";

type Props = {
  purchase: Purchase;
};

const AdminPurchasesRefundPolicy = ({ purchase }: Props) => {
  const productRefundPolicyTitle = purchase.link.product_refund_policy?.title || "None";

  const isDifferentThanProductRefundPolicy = () => {
    if (!purchase.purchase_refund_policy) return true;

    if (purchase.purchase_refund_policy.max_refund_period_in_days) {
      return (
        purchase.purchase_refund_policy.max_refund_period_in_days !==
        purchase.link.product_refund_policy?.max_refund_period_in_days
      );
    }

    return purchase.purchase_refund_policy.title !== purchase.link.product_refund_policy?.title;
  };

  const shouldDisplayTooltip = !isDifferentThanProductRefundPolicy();

  return (
    <div className="text-sm">
      <ul className="inline">
        {purchase.purchase_refund_policy ? (
          <>
            <li>Refund policy: {purchase.purchase_refund_policy.title}</li>
            {shouldDisplayTooltip ? (
              <WithTooltip tip={`Current refund policy: ${productRefundPolicyTitle}`}>
                <Icon name="solid-shield-exclamation" />
              </WithTooltip>
            ) : null}
          </>
        ) : null}
        <li>Seller: {purchase.seller.email}</li>
      </ul>
    </div>
  );
};

export default AdminPurchasesRefundPolicy;
