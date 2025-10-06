import React from "react";

import AdminCommentableComments from "$app/components/Admin/Commentable";
import type { Purchase } from "$app/components/Admin/Purchases/PurchaseDetails";

type AdminPurchaseCommentsProps = {
  purchase: Purchase;
};

const AdminPurchaseComments = ({ purchase }: AdminPurchaseCommentsProps) => (
  <AdminCommentableComments
    endpoint={Routes.admin_purchase_comments_path(purchase.id, { format: "json" })}
    commentableType="purchase"
  />
);

export default AdminPurchaseComments;
