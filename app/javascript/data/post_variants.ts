import { cast } from "ts-safe-cast";

import { request, ResponseError } from "$app/utils/request";

export type DistributionType = "percentage" | "count" | "unlimited" | "random";

export type DistributionRule = {
  id: string;
  post_variant_id: string;
  base_variant_id: string;
  distribution_type: DistributionType;
  distribution_value: number | null;
};

export type PostVariant = {
  id: string;
  name: string;
  message: string;
  is_control: boolean;
  distribution_rules: DistributionRule[];
};

export type VariantAssignment = {
  id: string;
  post_variant_id: string;
  subscription_id: string;
  assigned_at: string;
};

export type SubscriptionTier = {
  id: string;
  name: string;
};

export async function getPostVariants(installmentId: string): Promise<PostVariant[]> {
  const response = await request({
    method: "GET",
    accept: "json",
    url: `/api/internal/installments/${installmentId}/post_variants`,
  });

  if (!response.ok) throw new ResponseError();
  const data = cast<{ success: boolean; post_variants: PostVariant[] }>(await response.json());
  return data.post_variants;
}

export async function createPostVariant(
  installmentId: string,
  variant: { name: string; message: string; is_control: boolean },
): Promise<PostVariant> {
  const response = await request({
    method: "POST",
    accept: "json",
    url: `/api/internal/installments/${installmentId}/post_variants`,
    data: variant,
  });

  if (!response.ok) throw new ResponseError();
  const data = cast<{ success: boolean; post_variant: PostVariant }>(await response.json());
  return data.post_variant;
}

export async function updatePostVariant(
  installmentId: string,
  variantId: string,
  variant: { name?: string; message?: string; is_control?: boolean },
): Promise<PostVariant> {
  const response = await request({
    method: "PUT",
    accept: "json",
    url: `/api/internal/installments/${installmentId}/post_variants/${variantId}`,
    data: variant,
  });

  if (!response.ok) throw new ResponseError();
  const data = cast<{ success: boolean; post_variant: PostVariant }>(await response.json());
  return data.post_variant;
}

export async function deletePostVariant(installmentId: string, variantId: string): Promise<void> {
  const response = await request({
    method: "DELETE",
    accept: "json",
    url: `/api/internal/installments/${installmentId}/post_variants/${variantId}`,
  });

  if (!response.ok) throw new ResponseError();
}

export async function getDistributionRules(postVariantId: string): Promise<DistributionRule[]> {
  const response = await request({
    method: "GET",
    accept: "json",
    url: `/api/v2/post_variants/${postVariantId}/distribution_rules`,
  });

  if (!response.ok) throw new ResponseError();
  const data = cast<{ success: boolean; distribution_rules: DistributionRule[] }>(await response.json());
  return data.distribution_rules;
}

export async function createDistributionRule(
  postVariantId: string,
  rule: { base_variant_id: string; distribution_type: DistributionType; distribution_value?: number },
): Promise<DistributionRule> {
  const response = await request({
    method: "POST",
    accept: "json",
    url: `/api/v2/post_variants/${postVariantId}/distribution_rules`,
    data: rule,
  });

  if (!response.ok) throw new ResponseError();
  const data = cast<{ success: boolean; distribution_rule: DistributionRule }>(await response.json());
  return data.distribution_rule;
}

export async function updateDistributionRule(
  postVariantId: string,
  ruleId: string,
  rule: { distribution_type?: DistributionType; distribution_value?: number },
): Promise<DistributionRule> {
  const response = await request({
    method: "PUT",
    accept: "json",
    url: `/api/v2/post_variants/${postVariantId}/distribution_rules/${ruleId}`,
    data: rule,
  });

  if (!response.ok) throw new ResponseError();
  const data = cast<{ success: boolean; distribution_rule: DistributionRule }>(await response.json());
  return data.distribution_rule;
}

export async function deleteDistributionRule(postVariantId: string, ruleId: string): Promise<void> {
  const response = await request({
    method: "DELETE",
    accept: "json",
    url: `/api/v2/post_variants/${postVariantId}/distribution_rules/${ruleId}`,
  });

  if (!response.ok) throw new ResponseError();
}

export async function getVariantAssignments(postVariantId: string): Promise<VariantAssignment[]> {
  const response = await request({
    method: "GET",
    accept: "json",
    url: `/api/v2/post_variants/${postVariantId}/assignments`,
  });

  if (!response.ok) throw new ResponseError();
  const data = cast<{ success: boolean; assignments: VariantAssignment[] }>(await response.json());
  return data.assignments;
}
