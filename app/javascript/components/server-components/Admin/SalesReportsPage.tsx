import { createCast } from "ts-safe-cast";

import { register } from "$app/utils/serverComponentUtil";

import AdminSalesReportsPage from "$app/components/Admin/SalesReportsPage";

export default register({ component: AdminSalesReportsPage, propParser: createCast() });
