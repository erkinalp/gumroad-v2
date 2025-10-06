import { createCast } from "ts-safe-cast";

import { register } from "$app/utils/serverComponentUtil";

import AdminProductStats from "$app/components/Admin/Products/Stats";

export default register({ component: AdminProductStats, propParser: createCast() });
