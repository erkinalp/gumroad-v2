import { createCast } from "ts-safe-cast";

import { register } from "$app/utils/serverComponentUtil";

import AdminAddCreditForm from "$app/components/Admin/Users/AddCredit/Form";

export default register({ component: AdminAddCreditForm, propParser: createCast() });
