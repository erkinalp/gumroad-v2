import { Link, usePage } from "@inertiajs/react";
import * as React from "react";

import AdminNavFooter from "$app/components/Admin/Nav/Footer";
import { CloseOnNavigate } from "$app/components/CloseOnNavigate";
import { useAppDomain } from "$app/components/DomainSettings";
import { Nav as NavFramework, NavLink, InertiaNavLink, NavSection } from "$app/components/Nav";

type PageProps = { title: string; unreviewed_users_count: number | null };

const CountBadge = ({ count }: { count: number }) => (
  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-pink px-1.5 text-xs text-black">
    {count.toLocaleString()}
  </span>
);

const Nav = () => {
  const { title, unreviewed_users_count } = usePage<PageProps>().props;
  const routeParams = { host: useAppDomain() };

  return (
    <NavFramework title={title} footer={<AdminNavFooter />}>
      <CloseOnNavigate />
      <NavSection>
        <InertiaNavLink
          text="Suspend users"
          icon="shield-exclamation"
          href={Routes.admin_suspend_users_url(routeParams)}
          component={Link}
        />
        <InertiaNavLink
          text="Block emails"
          icon="envelope-fill"
          href={Routes.admin_block_email_domains_url(routeParams)}
          component={Link}
        />
        <InertiaNavLink
          text="Unblock emails"
          icon="envelope-open-fill"
          href={Routes.admin_unblock_email_domains_url(routeParams)}
          component={Link}
        />
        <NavLink text="Sidekiq" icon="lighting-fill" href={Routes.admin_sidekiq_web_url(routeParams)} />
        <NavLink text="Features" icon="solid-flag" href={Routes.admin_flipper_ui_url(routeParams)} />
        <InertiaNavLink
          text="Refund queue"
          icon="solid-currency-dollar"
          href={Routes.admin_refund_queue_url(routeParams)}
          component={Link}
        />
        <InertiaNavLink
          text="Sales reports"
          icon="bar-chart-fill"
          href={Routes.admin_sales_reports_url(routeParams)}
          component={Link}
        />
        <InertiaNavLink
          text="Unreviewed users"
          icon="people-fill"
          href={Routes.admin_unreviewed_users_url(routeParams)}
          component={Link}
          badge={unreviewed_users_count ? <CountBadge count={unreviewed_users_count} /> : undefined}
        />
      </NavSection>
    </NavFramework>
  );
};

export default Nav;
