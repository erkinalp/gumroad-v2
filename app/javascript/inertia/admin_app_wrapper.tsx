import React from "react";
import { classNames } from "$app/utils/classNames";

import { CurrentSellerProvider, parseCurrentSeller } from "$app/components/CurrentSeller";
import { DesignContextProvider, DesignSettings } from "$app/components/DesignSettings";
import { DomainSettingsProvider } from "$app/components/DomainSettings";
import { FeatureFlagsProvider } from "$app/components/FeatureFlags";
import LoadingSkeleton from "$app/components/LoadingSkeleton";
import { LoggedInUserProvider, parseLoggedInUser } from "$app/components/LoggedInUser";
import AdminNav from "$app/components/Admin/Nav";
import AdminSearchPopover from "$app/components/Admin/SearchPopover";
import Alert, { AlertPayload } from "$app/components/server-components/Alert";

import { SSRLocationProvider } from "$app/components/useOriginalLocation";
import { UserAgentProvider } from "$app/components/UserAgent";
import useRouteLoading from "$app/components/useRouteLoading";

import { LoggedInUser, Seller } from "$app/types/user";
import { DomainSettings } from "$app/types/domain_settings";

import { CurrentUser } from "$app/types/user";

type CardType = {
  id: string;
  name: string;
};

type GlobalProps = {
  design_settings: DesignSettings;
  domain_settings: DomainSettings;
  user_agent_info: {
    is_mobile: boolean;
  };
  logged_in_user: LoggedInUser;
  current_seller: Seller;
  href: string;
  locale: string;
  feature_flags: {
    require_email_typo_acknowledgment: boolean;
  };
  title: string;
  current_user: CurrentUser;
  card_types: CardType[];
  flash: AlertPayload | null;
};

const AdminAppWrapper = ({ children, global }: { children: React.ReactNode; global: GlobalProps }) => {
  const isRouteLoading = useRouteLoading();

  return (
    <DesignContextProvider value={global.design_settings}>
      <DomainSettingsProvider
        value={{
          scheme: global.domain_settings.scheme,
          appDomain: global.domain_settings.app_domain,
          rootDomain: global.domain_settings.root_domain,
          shortDomain: global.domain_settings.short_domain,
          discoverDomain: global.domain_settings.discover_domain,
          thirdPartyAnalyticsDomain: global.domain_settings.third_party_analytics_domain,
          apiDomain: global.domain_settings.api_domain,
        }}
      >
        <UserAgentProvider
          value={{
            isMobile: global.user_agent_info.is_mobile,
            locale: global.locale,
          }}
        >
          <LoggedInUserProvider value={parseLoggedInUser(global.logged_in_user)}>
            <CurrentSellerProvider value={parseCurrentSeller(global.current_seller)}>
              <SSRLocationProvider value={global.href}>
                <FeatureFlagsProvider value={global.feature_flags}>
                  <Alert initial={global.flash} />

                  <div id="inertia-shell" className="flex h-screen flex-col lg:flex-row">
                    <AdminNav title={global.title} current_user={global.current_user} />
                    <main className="flex-1 flex flex-col h-screen overflow-y-auto">
                      <header className="flex items-center justify-between border-b border-border p-4 md:p-8">
                        <h1>{global.title}</h1>
                        <div className="actions">
                          <AdminSearchPopover card_types={global.card_types} />
                        </div>
                      </header>
                      {isRouteLoading ? <LoadingSkeleton /> : null}
                      <div className={classNames("p-4 md:p-8", { hidden: isRouteLoading })}>{children}</div>
                    </main>
                  </div>
                </FeatureFlagsProvider>
              </SSRLocationProvider>
            </CurrentSellerProvider>
          </LoggedInUserProvider>
        </UserAgentProvider>
      </DomainSettingsProvider>
    </DesignContextProvider>
  );
}

export default AdminAppWrapper;
