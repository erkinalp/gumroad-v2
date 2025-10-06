import { usePage } from "@inertiajs/react";
import React from "react";

import { Pagination } from "$app/hooks/useLazyFetch";

import AdminActionCallInfos from "$app/components/Admin/ActionCallInfos";
import { type AdminActionCallInfoProps } from "$app/components/Admin/ActionCallInfos/ActionCallInfo";

type Props = {
  admin_action_call_infos: AdminActionCallInfoProps[];
  pagination: Pagination;
};

const AdminActionCallDashboardShow = () => {
  const { admin_action_call_infos, pagination } = usePage().props as unknown as Props;

  return (
    <div>
      <AdminActionCallInfos action_call_infos={admin_action_call_infos} pagination={pagination} />
    </div>
  );
};

export default AdminActionCallDashboardShow;
