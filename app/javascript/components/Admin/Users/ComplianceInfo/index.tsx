import React from "react";
import { cast } from "ts-safe-cast";

import { useLazyFetch } from "$app/hooks/useLazyFetch";

import ComplianceInfo, { type ComplianceInfoProps } from "$app/components/Admin/Users/ComplianceInfo/ComplianceInfo";
import type { User } from "$app/components/Admin/Users/User";

type AdminUserComplianceInfoProps = {
  user: User;
};

const AdminUserComplianceInfo = ({ user }: AdminUserComplianceInfoProps) => {
  const [open, setOpen] = React.useState(false);

  const {
    data: complianceInfo,
    isLoading,
    fetchData: fetchComplianceInfo,
  } = useLazyFetch<ComplianceInfoProps | null>(null as ComplianceInfoProps | null, {
    url: Routes.admin_user_compliance_info_path(user.id, { format: "json" }),
    responseParser: (data) => cast<ComplianceInfoProps | null>(data.compliance_info),
  });

  const onToggle = (e: React.MouseEvent<HTMLDetailsElement>) => {
    setOpen(e.currentTarget.open);
    if (e.currentTarget.open) {
      fetchComplianceInfo();
    }
  };

  return (
    <>
      <hr />
      <details open={open} onToggle={onToggle}>
        <summary>
          <h3>Compliance Info</h3>
        </summary>
        <ComplianceInfo complianceInfo={complianceInfo} isLoading={isLoading} />
      </details>
    </>
  );
};

export default AdminUserComplianceInfo;
