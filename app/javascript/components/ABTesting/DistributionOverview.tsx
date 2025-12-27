import * as React from "react";

import { DistributionRule, PostVariant, SubscriptionTier } from "$app/data/post_variants";

import { Icon } from "$app/components/Icons";

type TierAllocation = {
  tier: SubscriptionTier;
  variants: {
    variant: PostVariant;
    rule: DistributionRule | null;
    percentage: number | null;
    count: number | null;
    type: string;
  }[];
  totalPercentage: number;
  hasWarning: boolean;
  warningMessage: string | null;
};

export type DistributionOverviewProps = {
  variants: PostVariant[];
  tiers: SubscriptionTier[];
};

export const DistributionOverview = ({ variants, tiers }: DistributionOverviewProps) => {
  const allocations = React.useMemo(
    () =>
      tiers.map((tier): TierAllocation => {
        const variantAllocations = variants.map((variant) => {
          const rule = variant.distribution_rules.find((r) => r.base_variant_id === tier.id) ?? null;

          let percentage: number | null = null;
          let count: number | null = null;
          let type = "Not configured";

          if (rule) {
            switch (rule.distribution_type) {
              case "percentage":
                percentage = rule.distribution_value;
                type = `${rule.distribution_value}%`;
                break;
              case "count":
                count = rule.distribution_value;
                type = `${rule.distribution_value} subscribers`;
                break;
              case "unlimited":
                type = "Unlimited";
                break;
              case "random":
                type = "Random";
                break;
            }
          }

          return { variant, rule, percentage, count, type };
        });

        const totalPercentage = variantAllocations.reduce((sum, v) => sum + (v.percentage ?? 0), 0);

        let hasWarning = false;
        let warningMessage: string | null = null;

        if (totalPercentage > 100) {
          hasWarning = true;
          warningMessage = `Total percentage (${totalPercentage}%) exceeds 100%. Variants will be distributed proportionately less.`;
        } else if (variantAllocations.every((v) => !v.rule)) {
          hasWarning = true;
          warningMessage = "No distribution rules configured for this tier.";
        }

        return {
          tier,
          variants: variantAllocations,
          totalPercentage,
          hasWarning,
          warningMessage,
        };
      }),
    [variants, tiers],
  );

  if (variants.length === 0) {
    return (
      <div className="rounded border border-black/10 bg-black/5 p-4 text-center text-muted">
        <Icon name="outline-chart-bar" className="mb-2 text-2xl" />
        <p>No variants to display.</p>
        <p className="text-sm">Add variants to see the distribution overview.</p>
      </div>
    );
  }

  if (tiers.length === 0) {
    return (
      <div className="rounded border border-black/10 bg-black/5 p-4 text-center text-muted">
        <Icon name="outline-information-circle" className="mb-2 text-2xl" />
        <p>No subscription tiers available.</p>
        <p className="text-sm">Distribution overview requires subscription tiers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {allocations.map((allocation) => (
        <div key={allocation.tier.id} className="rounded border border-black/10 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-semibold">{allocation.tier.name}</h4>
            {allocation.hasWarning ? (
              <span className="flex items-center gap-1 text-sm text-orange-600">
                <Icon name="outline-exclamation" />
                Warning
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <Icon name="outline-check-circle" />
                Configured
              </span>
            )}
          </div>

          {allocation.warningMessage ? (
            <div className="mb-3 rounded bg-orange-100 p-2 text-sm text-orange-800">{allocation.warningMessage}</div>
          ) : null}

          <div className="mb-3">
            <div className="mb-1 flex h-4 overflow-hidden rounded bg-black/10">
              {allocation.variants.map((v, index) => {
                const width = v.percentage ?? (v.rule ? 100 / allocation.variants.length : 0);
                if (width === 0) return null;

                const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500"];
                const color = colors[index % colors.length];

                return (
                  <div
                    key={v.variant.id}
                    className={`${color} transition-all`}
                    style={{ width: `${Math.min(width, 100)}%` }}
                    title={`${v.variant.name}: ${v.type}`}
                  />
                );
              })}
            </div>
          </div>

          <div className="grid gap-2">
            {allocation.variants.map((v, index) => {
              const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500"];
              const color = colors[index % colors.length];

              return (
                <div key={v.variant.id} className="flex items-center gap-2 text-sm">
                  <span className={`h-3 w-3 rounded ${color}`} />
                  <span className="font-medium">{v.variant.name}</span>
                  {v.variant.is_control ? (
                    <span className="rounded bg-accent px-1.5 py-0.5 text-xs text-white">Control</span>
                  ) : null}
                  <span className="text-muted">-</span>
                  <span className="text-muted">{v.type}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="rounded border border-black/10 bg-black/5 p-4">
        <h4 className="mb-2 font-semibold">Distribution Priority</h4>
        <ol className="list-inside list-decimal space-y-1 text-sm text-muted">
          <li>
            <strong>Limited variants</strong> (percentage or count) are distributed first until their limits are reached
          </li>
          <li>
            <strong>Control variant</strong> receives remaining subscribers when limited variants are at capacity
          </li>
          <li>
            <strong>Unlimited variants</strong> receive random distribution if no control is set
          </li>
          <li>
            If <strong>no limited variants</strong> exist, all variants (including control) receive random distribution
          </li>
        </ol>
      </div>
    </div>
  );
};
