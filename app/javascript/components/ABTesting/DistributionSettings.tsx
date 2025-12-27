import * as React from "react";

import {
  DistributionRule,
  DistributionType,
  PostVariant,
  SubscriptionTier,
  createDistributionRule,
  updateDistributionRule,
  deleteDistributionRule,
} from "$app/data/post_variants";

import { Button } from "$app/components/Button";
import { Icon } from "$app/components/Icons";
import { NumberInput } from "$app/components/NumberInput";
import { Select } from "$app/components/Select";
import { WithTooltip } from "$app/components/WithTooltip";

const DISTRIBUTION_TYPE_OPTIONS: { id: DistributionType; label: string }[] = [
  { id: "percentage", label: "Percentage" },
  { id: "count", label: "Fixed Count" },
  { id: "unlimited", label: "Unlimited" },
  { id: "random", label: "Random" },
];

type DistributionRuleRowProps = {
  tier: SubscriptionTier;
  rule: DistributionRule | null;
  variantId: string;
  onRuleChange: (rule: DistributionRule | null) => void;
  isSaving: boolean;
};

const DistributionRuleRow = ({ tier, rule, variantId, onRuleChange, isSaving }: DistributionRuleRowProps) => {
  const [localType, setLocalType] = React.useState<DistributionType>(rule?.distribution_type ?? "unlimited");
  const [localValue, setLocalValue] = React.useState<number | null>(rule?.distribution_value ?? null);
  const [isEditing, setIsEditing] = React.useState(false);

  const needsValue = localType === "percentage" || localType === "count";

  const handleSave = async () => {
    try {
      if (rule) {
        const updated = await updateDistributionRule(variantId, rule.id, {
          distribution_type: localType,
          distribution_value: needsValue ? (localValue ?? 0) : undefined,
        });
        onRuleChange(updated);
      } else {
        const created = await createDistributionRule(variantId, {
          base_variant_id: tier.id,
          distribution_type: localType,
          distribution_value: needsValue ? (localValue ?? 0) : undefined,
        });
        onRuleChange(created);
      }
      setIsEditing(false);
    } catch {
      // Error handled silently - UI shows current state
    }
  };

  const handleDelete = async () => {
    if (!rule) return;
    try {
      await deleteDistributionRule(variantId, rule.id);
      onRuleChange(null);
      setLocalType("unlimited");
      setLocalValue(null);
    } catch {
      // Error handled silently - UI shows current state
    }
  };

  return (
    <tr className="border-b border-black/10 last:border-b-0">
      <td className="py-2 pr-4 font-medium">{tier.name}</td>
      <td className="py-2 pr-4">
        <Select<DistributionType>
          value={localType}
          onChange={(value) => {
            setLocalType(value);
            setIsEditing(true);
          }}
          options={DISTRIBUTION_TYPE_OPTIONS}
          disabled={isSaving}
        />
      </td>
      <td className="py-2 pr-4">
        {needsValue ? (
          <div className="flex items-center gap-2">
            <NumberInput
              value={localValue ?? 0}
              onChange={(value) => {
                setLocalValue(value);
                setIsEditing(true);
              }}
              min={1}
              max={localType === "percentage" ? 100 : undefined}
              disabled={isSaving}
            />
            {localType === "percentage" ? <span>%</span> : null}
          </div>
        ) : (
          <span className="text-muted">N/A</span>
        )}
      </td>
      <td className="py-2">
        <div className="flex gap-2">
          {isEditing ? (
            <Button onClick={handleSave} disabled={isSaving} color="primary">
              {isSaving ? "Saving..." : "Save"}
            </Button>
          ) : null}
          {rule ? (
            <WithTooltip tip="Remove rule">
              <Button onClick={handleDelete} disabled={isSaving}>
                <Icon name="trash2" />
              </Button>
            </WithTooltip>
          ) : null}
        </div>
      </td>
    </tr>
  );
};

export type DistributionSettingsProps = {
  variant: PostVariant;
  tiers: SubscriptionTier[];
  onRulesChange: (rules: DistributionRule[]) => void;
};

export const DistributionSettings = ({ variant, tiers, onRulesChange }: DistributionSettingsProps) => {
  const [isSaving, _setIsSaving] = React.useState(false);
  const [rules, setRules] = React.useState<Map<string, DistributionRule>>(
    new Map(variant.distribution_rules.map((r) => [r.base_variant_id, r])),
  );

  const handleRuleChange = (tierId: string, rule: DistributionRule | null) => {
    const newRules = new Map(rules);
    if (rule) {
      newRules.set(tierId, rule);
    } else {
      newRules.delete(tierId);
    }
    setRules(newRules);
    onRulesChange(Array.from(newRules.values()));
  };

  if (tiers.length === 0) {
    return (
      <div className="rounded border border-black/10 bg-black/5 p-4 text-center text-muted">
        <Icon name="outline-information-circle" className="mb-2 text-2xl" />
        <p>No subscription tiers available.</p>
        <p className="text-sm">Add subscription tiers to configure distribution rules.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-black/20 text-left">
            <th className="pr-4 pb-2 font-semibold">Tier</th>
            <th className="pr-4 pb-2 font-semibold">Distribution Type</th>
            <th className="pr-4 pb-2 font-semibold">Value</th>
            <th className="pb-2 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier) => (
            <DistributionRuleRow
              key={tier.id}
              tier={tier}
              rule={rules.get(tier.id) ?? null}
              variantId={variant.id}
              onRuleChange={(rule) => handleRuleChange(tier.id, rule)}
              isSaving={isSaving}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
