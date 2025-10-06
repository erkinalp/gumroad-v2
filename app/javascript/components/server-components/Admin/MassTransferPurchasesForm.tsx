import { createCast } from "ts-safe-cast";

import { register } from "$app/utils/serverComponentUtil";

import AdminMassTransferPurchasesForm from "$app/components/Admin/Users/MassTransferPurchases/Form";

export default register({ component: AdminMassTransferPurchasesForm, propParser: createCast() });
