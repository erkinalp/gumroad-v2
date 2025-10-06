import { createCast } from "ts-safe-cast";

import { register } from "$app/utils/serverComponentUtil";

import AdminUserGuids from "$app/components/Admin/Users/PermissionRisk/Guids";

export default register({ component: AdminUserGuids, propParser: createCast() });
