import { createCast } from "ts-safe-cast";

import { register } from "$app/utils/serverComponentUtil";

import AdminProductPurchases from "$app/components/Admin/Products/Purchases";

export default register({ component: AdminProductPurchases, propParser: createCast() });
