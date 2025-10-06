import React from "react";
import { cast } from "ts-safe-cast";

import { useLazyFetch } from "$app/hooks/useLazyFetch";

import PayoutInfo, { type PayoutInfoProps } from "$app/components/Admin/Users/PayoutInfo/PayoutInfo";
import type { User } from "$app/components/Admin/Users/User";

type AdminUserPayoutInfoProps = {
  user: User;
};

const AdminUserPayoutInfo = ({ user }: AdminUserPayoutInfoProps) => {
  const [open, setOpen] = React.useState(false);

  const onToggle = (e: React.MouseEvent<HTMLDetailsElement>) => {
    setOpen(e.currentTarget.open);
    if (e.currentTarget.open) {
      fetchPayoutInfo();
    }
  };

  const {
    data: payoutInfo,
    isLoading,
    fetchData: fetchPayoutInfo,
  } = useLazyFetch<PayoutInfoProps>({} as PayoutInfoProps, {
    url: Routes.admin_user_payout_info_path(user.id, { format: "json" }),
    responseParser: (data) => cast<PayoutInfoProps>(data.payout_info),
  });

  return (
    <>
      <hr />
      <details open={open} onToggle={onToggle}>
        <summary>
          <h3>Payout Info</h3>
        </summary>
        <PayoutInfo user_id={user.id} payoutInfo={payoutInfo} isLoading={isLoading} />
      </details>
    </>
  );
};

export default AdminUserPayoutInfo;
