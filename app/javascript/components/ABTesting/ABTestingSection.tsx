import * as React from "react";

import {
  PostVariant,
  SubscriptionTier,
  createPostVariant,
  deletePostVariant,
  updatePostVariant,
} from "$app/data/post_variants";

import { Button } from "$app/components/Button";
import { Details } from "$app/components/Details";
import { Icon } from "$app/components/Icons";
import { showAlert } from "$app/components/server-components/Alert";

import { DistributionOverview } from "./DistributionOverview";
import { DistributionSettings } from "./DistributionSettings";
import { VariantList } from "./VariantEditor";

export type ABTestingSectionProps = {
  installmentId: string;
  tiers: SubscriptionTier[];
  initialVariants?: PostVariant[];
  onVariantsChange?: (variants: PostVariant[]) => void;
};

export const ABTestingSection = ({
  installmentId,
  tiers,
  initialVariants = [],
  onVariantsChange,
}: ABTestingSectionProps) => {
  const [variants, setVariants] = React.useState<PostVariant[]>(initialVariants);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEnabled, setIsEnabled] = React.useState(initialVariants.length > 0);
  const [activeTab, setActiveTab] = React.useState<"variants" | "distribution" | "overview">("variants");
  const [selectedVariantId, setSelectedVariantId] = React.useState<string | null>(initialVariants[0]?.id ?? null);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null;

  const handleEnableABTesting = async () => {
    if (isEnabled) {
      setIsEnabled(false);
      return;
    }

    setIsLoading(true);
    try {
      const controlVariant = await createPostVariant(installmentId, {
        name: "Control",
        message: "",
        is_control: true,
      });
      const variantA = await createPostVariant(installmentId, {
        name: "Variant A",
        message: "",
        is_control: false,
      });

      const newVariants = [controlVariant, variantA];
      setVariants(newVariants);
      setIsEnabled(true);
      setSelectedVariantId(controlVariant.id);
      onVariantsChange?.(newVariants);
      showAlert("A/B testing enabled with Control and Variant A", "success");
    } catch {
      showAlert("Failed to enable A/B testing", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVariant = async () => {
    setIsLoading(true);
    try {
      const variantNumber = variants.length;
      const variantLetter = String.fromCharCode(65 + variantNumber - 1);
      const newVariant = await createPostVariant(installmentId, {
        name: `Variant ${variantLetter}`,
        message: "",
        is_control: false,
      });

      const newVariants = [...variants, newVariant];
      setVariants(newVariants);
      setSelectedVariantId(newVariant.id);
      onVariantsChange?.(newVariants);
      showAlert(`Variant ${variantLetter} added`, "success");
    } catch {
      showAlert("Failed to add variant", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateVariant = async (variantId: string, updates: Partial<PostVariant>) => {
    try {
      const updated = await updatePostVariant(installmentId, variantId, updates);
      const newVariants = variants.map((v) => (v.id === variantId ? updated : v));
      setVariants(newVariants);
      onVariantsChange?.(newVariants);
    } catch {
      showAlert("Failed to update variant", "error");
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    try {
      await deletePostVariant(installmentId, variantId);
      const newVariants = variants.filter((v) => v.id !== variantId);
      setVariants(newVariants);

      if (selectedVariantId === variantId) {
        setSelectedVariantId(newVariants[0]?.id ?? null);
      }

      if (newVariants.length === 0) {
        setIsEnabled(false);
      }

      onVariantsChange?.(newVariants);
      showAlert("Variant deleted", "success");
    } catch {
      showAlert("Failed to delete variant", "error");
    }
  };

  const handleSetControl = async (variantId: string) => {
    try {
      const updated = await updatePostVariant(installmentId, variantId, {
        is_control: true,
      });

      const newVariants = variants.map((v) => {
        if (v.id === variantId) return updated;
        if (v.is_control) return { ...v, is_control: false };
        return v;
      });

      setVariants(newVariants);
      onVariantsChange?.(newVariants);
      showAlert("Control variant updated", "success");
    } catch {
      showAlert("Failed to set control variant", "error");
    }
  };

  const handleReorder = (newOrder: string[]) => {
    const reorderedVariants = newOrder
      .map((id) => variants.find((v) => v.id === id))
      .filter((v): v is PostVariant => v !== undefined);
    setVariants(reorderedVariants);
    onVariantsChange?.(reorderedVariants);
  };

  if (!isEnabled) {
    return (
      <Details
        summary={
          <div className="flex items-center gap-2">
            <Icon name="outline-beaker" />
            <span>A/B Testing</span>
          </div>
        }
        open={false}
      >
        <div className="p-4">
          <div className="mb-4 rounded border border-black/10 bg-black/5 p-4 text-center">
            <Icon name="outline-beaker" className="mb-2 text-4xl text-muted" />
            <h3 className="mb-2 font-semibold">A/B Testing</h3>
            <p className="mb-4 text-muted">
              Test different versions of your post content to see which performs better with your subscribers.
            </p>
            <Button onClick={handleEnableABTesting} disabled={isLoading} color="primary">
              {isLoading ? "Enabling..." : "Enable A/B Testing"}
            </Button>
          </div>
        </div>
      </Details>
    );
  }

  return (
    <Details
      summary={
        <div className="flex items-center gap-2">
          <Icon name="outline-beaker" />
          <span>A/B Testing</span>
          <span className="rounded bg-accent px-2 py-0.5 text-xs text-white">
            {variants.length} variant{variants.length !== 1 ? "s" : ""}
          </span>
        </div>
      }
      open
    >
      <div className="p-4">
        <div className="mb-4 flex flex-wrap gap-2 border-b border-black/10 pb-4">
          <Button onClick={() => setActiveTab("variants")} color={activeTab === "variants" ? "primary" : undefined}>
            <Icon name="outline-document-duplicate" />
            Variants
          </Button>
          <Button
            onClick={() => setActiveTab("distribution")}
            color={activeTab === "distribution" ? "primary" : undefined}
          >
            <Icon name="outline-adjustments" />
            Distribution
          </Button>
          <Button onClick={() => setActiveTab("overview")} color={activeTab === "overview" ? "primary" : undefined}>
            <Icon name="outline-chart-bar" />
            Overview
          </Button>
        </div>

        {activeTab === "variants" ? (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Variants ({variants.length})</h3>
              <Button onClick={handleAddVariant} disabled={isLoading}>
                <Icon name="outline-plus" />
                Add Variant
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Icon name="outline-refresh" className="animate-spin text-2xl" />
              </div>
            ) : (
              <VariantList
                variants={variants}
                onUpdateVariant={handleUpdateVariant}
                onDeleteVariant={handleDeleteVariant}
                onSetControl={handleSetControl}
                onReorder={handleReorder}
              />
            )}
          </div>
        ) : null}

        {activeTab === "distribution" ? (
          <div>
            <div className="mb-4">
              <h3 className="font-semibold">Distribution Settings</h3>
              <p className="text-sm text-muted">
                Configure how each variant is distributed to subscribers in each tier.
              </p>
            </div>

            {variants.length === 0 ? (
              <div className="rounded border border-black/10 bg-black/5 p-4 text-center text-muted">
                <p>Add variants first to configure distribution settings.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => (
                    <Button
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      color={selectedVariantId === variant.id ? "primary" : undefined}
                    >
                      {variant.name}
                      {variant.is_control ? " (Control)" : ""}
                    </Button>
                  ))}
                </div>

                {selectedVariant ? (
                  <DistributionSettings
                    variant={selectedVariant}
                    tiers={tiers}
                    onRulesChange={(rules) => {
                      const newVariants = variants.map((v) =>
                        v.id === selectedVariant.id ? { ...v, distribution_rules: rules } : v,
                      );
                      setVariants(newVariants);
                      onVariantsChange?.(newVariants);
                    }}
                  />
                ) : null}
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "overview" ? (
          <div>
            <div className="mb-4">
              <h3 className="font-semibold">Distribution Overview</h3>
              <p className="text-sm text-muted">
                Visual summary of how variants are distributed across subscription tiers.
              </p>
            </div>

            <DistributionOverview variants={variants} tiers={tiers} />
          </div>
        ) : null}
      </div>
    </Details>
  );
};

export default ABTestingSection;
