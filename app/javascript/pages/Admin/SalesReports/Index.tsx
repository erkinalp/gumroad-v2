import { usePage } from "@inertiajs/react";
import React from "react";

import AdminSalesReportsPage from "$app/components/Admin/SalesReportsPage";

type Props = {
  countries: [string, string][];
  job_history: JobHistoryItem[];
  form_action: string;
  authenticity_token: string;
};

type JobHistoryItem = {
  job_id: string;
  country_code: string;
  start_date: string;
  end_date: string;
  enqueued_at: string;
  status: string;
  download_url?: string;
};

const AdminSalesReports = () => {
  const { countries, job_history, form_action, authenticity_token } = usePage().props as unknown as Props;

  return (
    <AdminSalesReportsPage
      countries={countries}
      job_history={job_history}
      form_action={form_action}
      authenticity_token={authenticity_token}
    />
  );
};

export default AdminSalesReports;
