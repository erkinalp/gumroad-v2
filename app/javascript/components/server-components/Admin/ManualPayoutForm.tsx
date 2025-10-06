import { createCast } from "ts-safe-cast";

import { register } from "$app/utils/serverComponentUtil";

import AdminManualPayoutForm from "$app/components/Admin/Users/PayoutInfo/ManualPayoutForm";
export default register({ component: AdminManualPayoutForm, propParser: createCast() });
