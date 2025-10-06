import { usePage } from "@inertiajs/react";
import React from "react";

import AdminMerchantAccount, {
  type LiveAttributesProps,
  type AdminMerchantAccountProps,
} from "$app/components/Admin/MerchantAccounts/MerchantAccount";

const AdminMerchantAccountsShow = () => {
  const { merchant_account, live_attributes } = usePage<{
    merchant_account: AdminMerchantAccountProps;
    live_attributes: LiveAttributesProps;
  }>().props;

  return (
    <div>
      <AdminMerchantAccount merchant_account={merchant_account} live_attributes={live_attributes} />
    </div>
  );
};

export default AdminMerchantAccountsShow;
