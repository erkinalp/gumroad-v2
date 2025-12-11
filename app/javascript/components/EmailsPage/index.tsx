import cx from "classnames";
import React from "react";
import { Link } from "react-router-dom";

import { previewInstallment, SavedInstallment } from "$app/data/installments";
import { formatStatNumber } from "$app/utils/formatStatNumber";
import { asyncVoid } from "$app/utils/promise";
import { assertResponseError } from "$app/utils/request";

import { Button } from "$app/components/Button";
import { Icon } from "$app/components/Icons";
import { Popover } from "$app/components/Popover";
import { showAlert } from "$app/components/server-components/Alert";
import { DraftsTab } from "$app/components/server-components/EmailsPage/DraftsTab";
import { PublishedTab } from "$app/components/server-components/EmailsPage/PublishedTab";
import { ScheduledTab } from "$app/components/server-components/EmailsPage/ScheduledTab";
import { PageHeader } from "$app/components/ui/PageHeader";
import Placeholder from "$app/components/ui/Placeholder";
import { Tabs, Tab } from "$app/components/ui/Tabs";
import { WithTooltip } from "$app/components/WithTooltip";

const TABS = ["published", "scheduled", "drafts", "subscribers"] as const;

export const emailTabPath = (tab: (typeof TABS)[number]) => `/emails/${tab}`;
export const newEmailPath = "/emails/new";
export const editEmailPath = (id: string) => `/emails/${id}/edit`;

export const Layout = ({
  selectedTab,
  children,
  hasPosts,
}: {
  selectedTab: (typeof TABS)[number];
  children: React.ReactNode;
  hasPosts?: boolean;
}) => {
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [isSearchPopoverOpen, setIsSearchPopoverOpen] = React.useState(false);
  const [query, setQuery] = useSearchContext();
  React.useEffect(() => {
    if (isSearchPopoverOpen) searchInputRef.current?.focus();
  }, [isSearchPopoverOpen]);

  return (
    <div>
      <PageHeader
        title="Emails"
        actions={
          <>
            {hasPosts ? (
              <Popover
                open={isSearchPopoverOpen}
                onToggle={setIsSearchPopoverOpen}
                aria-label="Toggle Search"
                trigger={
                  <WithTooltip tip="Search" position="bottom">
                    <div className="button">
                      <Icon name="solid-search" />
                    </div>
                  </WithTooltip>
                }
              >
                <div className="input">
                  <Icon name="solid-search" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search emails"
                    value={query}
                    onChange={(evt) => setQuery(evt.target.value)}
                  />
                </div>
              </Popover>
            ) : null}
            <NewEmailButton />
          </>
        }
      >
        <Tabs>
          {TABS.map((tab) =>
            tab === "subscribers" ? (
              <Tab href={Routes.followers_path()} isSelected={false} key={tab}>
                Subscribers
              </Tab>
            ) : (
              <Tab href={emailTabPath(tab)} isSelected={selectedTab === tab} key={tab}>
                {tab === "published" ? "Published" : tab === "scheduled" ? "Scheduled" : "Drafts"}
              </Tab>
            ),
          )}
        </Tabs>
      </PageHeader>
      {children}
    </div>
  );
};

export const NewEmailButton = ({ copyFrom }: { copyFrom?: string } = {}) => {
  return (
    <Link
      className={cx("button", { accent: !copyFrom })}
      to={copyFrom ? `${newEmailPath}?copy_from=${copyFrom}` : newEmailPath}
    >
      {copyFrom ? "Duplicate" : "New email"}
    </Link>
  );
};

export const EditEmailButton = ({ id }: { id: string }) => {
  return (
    <Link className="button" to={editEmailPath(id)}>
      Edit
    </Link>
  );
};

export const ViewEmailButton = (props: { installment: SavedInstallment }) => {
  const [sendingPreviewEmail, setSendingPreviewEmail] = React.useState(false);

  return (
    <Button
      disabled={sendingPreviewEmail}
      onClick={asyncVoid(async () => {
        setSendingPreviewEmail(true);
        try {
          await previewInstallment(props.installment.external_id);
          showAlert("A preview has been sent to your email.", "success");
        } catch (error) {
          assertResponseError(error);
          showAlert(error.message, "error");
        } finally {
          setSendingPreviewEmail(false);
        }
      })}
    >
      <Icon name="envelope-fill"></Icon>
      {sendingPreviewEmail ? "Sending..." : "View email"}
    </Button>
  );
};

export const EmptyStatePlaceholder = ({
  title,
  description,
  placeholderImage,
}: {
  title: string;
  description: string;
  placeholderImage: string;
}) => (
  <Placeholder>
    <figure>
      <img src={placeholderImage} />
    </figure>
    <h2>{title}</h2>
    <p>{description}</p>
    <NewEmailButton />
    <p>
      <a href="/help/article/169-how-to-send-an-update" target="_blank" rel="noreferrer">
        Learn more about emails
      </a>
    </p>
  </Placeholder>
);

export type AudienceCounts = Map<string, number | "loading" | "failed">;
export const audienceCountValue = (audienceCounts: AudienceCounts, installmentId: string) => {
  const count = audienceCounts.get(installmentId);
  return count === undefined || count === "loading"
    ? null
    : count === "failed"
      ? "--"
      : formatStatNumber({ value: count });
};

const SearchContext = React.createContext<[string, (thing: string) => void] | null>(null);
export const useSearchContext = () => {
  const context = React.useContext(SearchContext);
  if (!context) throw new Error("useSearchContext must be used within SearchContext.Provider");
  return context;
};

export default function EmailsPageComponent() {
  const queryState = React.useState("");
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";

  const selectedTab = currentPath.includes("/scheduled")
    ? "scheduled"
    : currentPath.includes("/drafts")
      ? "drafts"
      : "published";

  const hasPosts = true; // This will be passed as a prop in the future if needed

  return (
    <SearchContext.Provider value={queryState}>
      <Layout selectedTab={selectedTab} hasPosts={hasPosts}>
        {selectedTab === "published" && <PublishedTab />}
        {selectedTab === "scheduled" && <ScheduledTab />}
        {selectedTab === "drafts" && <DraftsTab />}
      </Layout>
    </SearchContext.Provider>
  );
}
