import { createCast } from "ts-safe-cast";

import { register } from "$app/utils/serverComponentUtil";

import AdminSetCustomFeeForm from "$app/components/Admin/Users/CustomFee/Form";

export default register({ component: AdminSetCustomFeeForm, propParser: createCast() });
