import { createCast } from "ts-safe-cast";

import { register } from "$app/utils/serverComponentUtil";

import AdminChangeEmailForm from "$app/components/Admin/Users/ChangeEmail/Form";
export default register({ component: AdminChangeEmailForm, propParser: createCast() });
