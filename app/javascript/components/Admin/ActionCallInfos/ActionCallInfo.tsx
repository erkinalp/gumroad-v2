import React from "react";

export type AdminActionCallInfoProps = {
  index: number;
  controller_name: string;
  action_name: string;
  call_count: number;
};

const AdminActionCallInfosActionCallInfo = ({
  index,
  controller_name,
  action_name,
  call_count,
}: AdminActionCallInfoProps) => (
  <tr>
    <td>{index}</td>
    <td>{controller_name}</td>
    <td>{action_name}</td>
    <td>{call_count}</td>
  </tr>
);

export default AdminActionCallInfosActionCallInfo;
