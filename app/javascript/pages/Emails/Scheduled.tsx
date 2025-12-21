import { router, useForm, usePage } from "@inertiajs/react";
import React from "react";
import { cast } from "ts-safe-cast";

import { getAudienceCount, Pagination, ScheduledInstallment } from "$app/data/installments";
import { assertDefined } from "$app/utils/assert";
import { formatStatNumber } from "$app/utils/formatStatNumber";
import { asyncVoid } from "$app/utils/promise";
import { assertResponseError } from "$app/utils/request";

import { Button, NavigationButton } from "$app/components/Button";
import { useCurrentSeller } from "$app/components/CurrentSeller";
import { EmptyStatePlaceholder } from "$app/components/EmailsPage/EmptyStatePlaceholder";
import { EditEmailButton, EmailsLayout, NewEmailButton } from "$app/components/EmailsPage/Layout";
import { ViewEmailButton } from "$app/components/EmailsPage/ViewEmailButton";
import { Icon } from "$app/components/Icons";
import { Modal } from "$app/components/Modal";
import { showAlert } from "$app/components/server-components/Alert";
import { Sheet, SheetHeader } from "$app/components/ui/Sheet";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "$app/components/ui/Table";
import { useUserAgentInfo } from "$app/components/UserAgent";

import scheduledPlaceholder from "$assets/images/placeholders/scheduled_posts.png";

type AudienceCounts = Map<string, number | "loading" | "failed">;

const audienceCountValue = (audienceCounts: AudienceCounts, installmentId: string) => {
  const count = audienceCounts.get(installmentId);
  return count === undefined || count === "loading"
    ? null
    : count === "failed"
      ? "--"
      : formatStatNumber({ value: count });
};

type PageProps = {
  installments: ScheduledInstallment[];
  pagination: Pagination;
  has_posts: boolean;
};

export default function EmailsScheduled() {
  const pageProps = cast<PageProps>(usePage().props);
  const { installments, pagination, has_posts } = pageProps;
  const currentSeller = assertDefined(useCurrentSeller(), "currentSeller is required");
  const userAgentInfo = useUserAgentInfo();
  const [query, setQuery] = React.useState("");

  // Accumulate installments across pages
  const [allInstallments, setAllInstallments] = React.useState(installments);
  React.useEffect(() => {
    if (pagination.page === 1) {
      // Reset when on first page (initial load or search)
      setAllInstallments(installments);
    } else {
      // Append new installments for subsequent pages
      setAllInstallments((prev) => {
        const existingIds = new Set(prev.map((i) => i.external_id));
        const newInstallments = installments.filter((i) => !existingIds.has(i.external_id));
        return [...prev, ...newInstallments];
      });
    }
  }, [installments, pagination.page]);

  const handleQueryChange = React.useCallback((newQuery: string) => {
    setQuery(newQuery);
    router.reload({ data: { query: newQuery || undefined } });
  }, []);

  const handleLoadMore = React.useCallback(() => {
    router.reload({ data: { page: pagination.next, query: query || undefined } });
  }, [pagination.next, query]);

  const installmentsByDate = React.useMemo(
    () =>
      allInstallments.reduce<Record<string, ScheduledInstallment[]>>((acc, installment) => {
        const date = new Date(installment.to_be_published_at).toLocaleDateString(userAgentInfo.locale, {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: currentSeller.timeZone.name,
        });
        if (!acc[date]) acc[date] = [];
        acc[date].push(installment);
        return acc;
      }, {}),
    [allInstallments, userAgentInfo.locale, currentSeller.timeZone.name],
  );
  const [audienceCounts, setAudienceCounts] = React.useState<AudienceCounts>(new Map());
  React.useEffect(() => {
    allInstallments.forEach(
      asyncVoid(async ({ external_id }) => {
        if (audienceCounts.has(external_id)) return;
        setAudienceCounts((prev) => new Map(prev).set(external_id, "loading"));
        try {
          const { count } = await getAudienceCount(external_id);
          setAudienceCounts((prev) => new Map(prev).set(external_id, count));
        } catch (e) {
          assertResponseError(e);
          setAudienceCounts((prev) => new Map(prev).set(external_id, "failed"));
        }
      }),
    );
  }, [allInstallments]);
  const [selectedInstallment, setSelectedInstallment] = React.useState<ScheduledInstallment | null>(null);
  const [installmentToDelete, setInstallmentToDelete] = React.useState<ScheduledInstallment | null>(null);

  const deleteForm = useForm({});
  const handleDelete = () => {
    if (!installmentToDelete) return;
    deleteForm.delete(Routes.email_path(installmentToDelete.external_id), {
      onSuccess: () => {
        setInstallmentToDelete(null);
        setSelectedInstallment(null);
        // Remove deleted installment from accumulated list
        setAllInstallments((prev) => prev.filter((i) => i.external_id !== installmentToDelete.external_id));
      },
      onError: () => {
        showAlert("Sorry, something went wrong. Please try again.", "error");
      },
    });
  };

  return (
    <EmailsLayout selectedTab="scheduled" hasPosts={has_posts} query={query} onQueryChange={handleQueryChange}>
      <div className="space-y-4 p-4 md:p-8">
        {allInstallments.length > 0 ? (
          <>
            {Object.keys(installmentsByDate).map((date) => (
              <Table key={date} aria-live="polite" className="mb-16">
                <TableCaption>Scheduled for {date}</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Sent to</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Delivery Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installmentsByDate[date]?.map((installment) => (
                    <TableRow
                      key={installment.external_id}
                      selected={installment.external_id === selectedInstallment?.external_id}
                      onClick={() => setSelectedInstallment(installment)}
                    >
                      <TableCell>{installment.name}</TableCell>
                      <TableCell>{installment.recipient_description}</TableCell>
                      <TableCell
                        aria-busy={audienceCountValue(audienceCounts, installment.external_id) === null}
                        className="whitespace-nowrap"
                      >
                        {audienceCountValue(audienceCounts, installment.external_id)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(installment.to_be_published_at).toLocaleTimeString(userAgentInfo.locale, {
                          hour: "numeric",
                          minute: "numeric",
                          timeZone: currentSeller.timeZone.name,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ))}
            {pagination.next ? (
              <Button color="primary" onClick={handleLoadMore}>
                Load more
              </Button>
            ) : null}
            {selectedInstallment ? (
              <Sheet open onOpenChange={() => setSelectedInstallment(null)}>
                <SheetHeader>{selectedInstallment.name}</SheetHeader>
                <div className="stack">
                  <div>
                    <h5>Sent to</h5>
                    {selectedInstallment.recipient_description}
                  </div>
                  <div>
                    <h5>Audience</h5>
                    {audienceCountValue(audienceCounts, selectedInstallment.external_id)}
                  </div>
                  <div>
                    <h5>Delivery Time</h5>
                    {new Date(selectedInstallment.to_be_published_at).toLocaleString(userAgentInfo.locale, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      timeZone: currentSeller.timeZone.name,
                    })}
                  </div>
                </div>
                <div className="grid grid-flow-col gap-4">
                  {selectedInstallment.send_emails ? <ViewEmailButton installment={selectedInstallment} /> : null}
                  {selectedInstallment.shown_on_profile ? (
                    <NavigationButton href={selectedInstallment.full_url} target="_blank" rel="noopener noreferrer">
                      <Icon name="file-earmark-medical-fill"></Icon>
                      View post
                    </NavigationButton>
                  ) : null}
                </div>
                <div className="grid grid-flow-col gap-4">
                  <NewEmailButton copyFrom={selectedInstallment.external_id} />
                  <EditEmailButton id={selectedInstallment.external_id} />
                  <Button color="danger" onClick={() => setInstallmentToDelete(selectedInstallment)}>
                    Delete
                  </Button>
                </div>
              </Sheet>
            ) : null}
            {installmentToDelete ? (
              <Modal
                open
                allowClose={!deleteForm.processing}
                onClose={() => setInstallmentToDelete(null)}
                title="Delete email?"
                footer={
                  <>
                    <Button disabled={deleteForm.processing} onClick={() => setInstallmentToDelete(null)}>
                      Cancel
                    </Button>
                    <Button color="danger" disabled={deleteForm.processing} onClick={handleDelete}>
                      {deleteForm.processing ? "Deleting..." : "Delete email"}
                    </Button>
                  </>
                }
              >
                <h4>
                  Are you sure you want to delete the email "{installmentToDelete.name}"? This action cannot be undone.
                </h4>
              </Modal>
            ) : null}
          </>
        ) : (
          <EmptyStatePlaceholder
            title="Set it and forget it."
            description="Schedule an email to be sent exactly when you want."
            placeholderImage={scheduledPlaceholder}
          />
        )}
      </div>
    </EmailsLayout>
  );
}
