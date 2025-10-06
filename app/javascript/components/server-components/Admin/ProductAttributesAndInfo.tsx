import { createCast } from "ts-safe-cast";

import { register } from "$app/utils/serverComponentUtil";

import ProductAttributesAndInfo from "$app/components/Admin/Products/AttributesAndInfo";

export default register({ component: ProductAttributesAndInfo, propParser: createCast() });
