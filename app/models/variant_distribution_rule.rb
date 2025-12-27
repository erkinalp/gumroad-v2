# frozen_string_literal: true

class VariantDistributionRule < ApplicationRecord
  include ExternalId

  belongs_to :post_variant
  belongs_to :base_variant

  enum :distribution_type, { percentage: 0, count: 1, unlimited: 2, random: 3 }

  validates :distribution_type, presence: true
  validates :distribution_value, presence: true, if: -> { percentage? || count? }
  validates :distribution_value, numericality: { greater_than: 0, less_than_or_equal_to: 100 }, if: :percentage?
  validates :distribution_value, numericality: { greater_than: 0 }, if: :count?

  def limited?
    percentage? || count?
  end

  def slots_available?(current_assignment_count, total_assignments = 0)
    return true if unlimited? || random?

    if percentage?
      target_count = (total_assignments * distribution_value / 100.0).ceil
      current_assignment_count < [target_count, 1].max
    else
      current_assignment_count < distribution_value
    end
  end

  def as_json(_options = {})
    {
      "id" => external_id,
      "post_variant_id" => post_variant.external_id,
      "base_variant_id" => base_variant.external_id,
      "distribution_type" => distribution_type,
      "distribution_value" => distribution_value
    }
  end
end
