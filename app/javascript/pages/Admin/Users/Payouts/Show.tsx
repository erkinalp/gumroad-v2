import { usePage } from "@inertiajs/react";
import React from "react";

import AdminPayout, { type Payout } from "$app/components/Admin/Payouts/Payout";

type Props = {
  payout: Payout;
};

const AdminPayoutsShow = () => {
  const { payout } = usePage().props as unknown as Props;

  return (
    <div className="paragraphs">
      <AdminPayout payout={payout} />
    </div>
  );
};

export default AdminPayoutsShow;
