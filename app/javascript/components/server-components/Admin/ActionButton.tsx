// Backward compatibility until we remove server components
import { createCast } from "ts-safe-cast";

import { register } from "$app/utils/serverComponentUtil";

import AdminActionButton from "$app/components/Admin/ActionButton";

export default register({ component: AdminActionButton, propParser: createCast() });
