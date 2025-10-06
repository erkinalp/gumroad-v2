import { createCast } from "ts-safe-cast";

import { register } from "$app/utils/serverComponentUtil";

import AdminFlagForTosViolationsForm from "$app/components/Admin/Products/FlagForTosViolations/Form";

export default register({ component: AdminFlagForTosViolationsForm, propParser: createCast() });
