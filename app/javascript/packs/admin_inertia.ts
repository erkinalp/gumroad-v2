import { createInertiaApp } from "@inertiajs/react";
import { createElement } from "react";
import { createRoot } from "react-dom/client";

import AdminAppWrapper from "../inertia/admin_app_wrapper";

async function resolvePageComponent(name: string) {
  try {
    const module = await import(`../pages/${name}.tsx`);
    return module.default;
  } catch {
    try {
      const module = await import(`../pages/${name}.jsx`);
      return module.default;
    } catch {
      throw new Error(`Admin page component not found: ${name}`);
    }
  }
}

createInertiaApp({
  progress: false,
  resolve: (name: string) => resolvePageComponent(name),
  setup({ el, App, props }) {
    if (!el) return;

    const global = props.initialPage.props as any;

    const root = createRoot(el);
    root.render(createElement(AdminAppWrapper, { global, children: createElement(App, props) }));
  },
  title: (title: string) => title ?? "Admin",
});
