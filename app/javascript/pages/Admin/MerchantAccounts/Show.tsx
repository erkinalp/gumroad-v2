import { usePage } from "@inertiajs/react";
import React from "react";

import AdminMerchantAccount, {
  type LiveAttributesProps,
  type AdminMerchantAccountProps,
} from "$app/components/Admin/MerchantAccounts/MerchantAccount";

const AdminMerchantAccountsShow = () => {
  const { merchant_account, live_attributes } = usePage().props as unknown as {
    merchant_account: AdminMerchantAccountProps;
    live_attributes: LiveAttributesProps;
  };

  return (
    <div>
      <AdminMerchantAccount merchant_account={merchant_account} live_attributes={live_attributes} />
    </div>
  );
};

export default AdminMerchantAccountsShow;
