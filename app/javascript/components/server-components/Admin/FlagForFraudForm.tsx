import { createCast } from "ts-safe-cast";

import { register } from "$app/utils/serverComponentUtil";

import AdminFlagForFraudForm from "$app/components/Admin/Users/PermissionRisk/FlagForFraud/Form";

export default register({ component: AdminFlagForFraudForm, propParser: createCast() });
