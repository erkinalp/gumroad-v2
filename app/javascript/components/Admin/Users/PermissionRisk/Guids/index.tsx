import * as React from "react";
import { cast } from "ts-safe-cast";

import { useLazyFetch } from "$app/hooks/useLazyFetch";

import Loading from "$app/components/Admin/Loading";
import Guid from "$app/components/Admin/Users/PermissionRisk/Guids/Guid";

type UserGuids = { guid: string; user_ids: number[] }[];

const UserGuidsContent = ({ userGuids, isLoading }: { userGuids: UserGuids; isLoading: boolean }) => {
  if (isLoading) return <Loading />;
  if (userGuids.length > 0)
    return (
      <div className="stack">
        {userGuids.map(({ guid, user_ids }) => (
          <Guid key={guid} guid={guid} user_ids={user_ids} />
        ))}
      </div>
    );
  return (
    <div className="info" role="status">
      No GUIDs found.
    </div>
  );
};

const AdminUserGuids = ({ user_id }: { user_id: number }) => {
  const [open, setOpen] = React.useState(false);

  const {
    data: userGuids,
    isLoading,
    fetchData: fetchUserGuids,
  } = useLazyFetch<UserGuids>([], {
    url: Routes.admin_compliance_guids_path(user_id, { format: "json" }),
    responseParser: (data) => cast<UserGuids>(data),
  });

  const onToggle = (e: React.MouseEvent<HTMLDetailsElement>) => {
    setOpen(e.currentTarget.open);
    if (e.currentTarget.open) {
      fetchUserGuids();
    }
  };

  return (
    <>
      <hr />
      <details open={open} onToggle={onToggle}>
        <summary>
          <h3>GUIDs</h3>
        </summary>
        <UserGuidsContent userGuids={userGuids} isLoading={isLoading} />
      </details>
    </>
  );
};

export default AdminUserGuids;
