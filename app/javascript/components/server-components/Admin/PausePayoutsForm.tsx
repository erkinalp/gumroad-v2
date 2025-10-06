import { createCast } from "ts-safe-cast";

import { register } from "$app/utils/serverComponentUtil";

import TogglePayoutsForm from "$app/components/Admin/Users/PayoutInfo/TogglePayoutsForm";
export default register({ component: TogglePayoutsForm, propParser: createCast() });
