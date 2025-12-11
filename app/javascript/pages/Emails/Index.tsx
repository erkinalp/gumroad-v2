import React from "react";
import { RouterProvider, createBrowserRouter, json } from "react-router-dom";

import EmailsPageComponent from "$app/components/EmailsPage";
import { EmailForm } from "$app/components/server-components/EmailsPage/EmailForm";
import { newEmailPath, editEmailPath } from "$app/components/EmailsPage";
import { getNewInstallment, getEditInstallment } from "$app/data/installments";
import { assertDefined } from "$app/utils/assert";

export default function EmailsPage() {
  const router = React.useMemo(
    () =>
      createBrowserRouter([
        {
          path: "/emails/published",
          element: <EmailsPageComponent />,
        },
        {
          path: "/emails/scheduled",
          element: <EmailsPageComponent />,
        },
        {
          path: "/emails/drafts",
          element: <EmailsPageComponent />,
        },
        {
          path: newEmailPath,
          element: <EmailForm />,
          loader: async ({ request }) =>
            json(await getNewInstallment(new URL(request.url).searchParams.get("copy_from")), {
              status: 200,
            }),
        },
        {
          path: editEmailPath(":id"),
          element: <EmailForm />,
          loader: async ({ params }) =>
            json(await getEditInstallment(assertDefined(params.id, "Installment ID is required")), { status: 200 }),
        },
      ]),
    [],
  );

  return <RouterProvider router={router} />;
}
