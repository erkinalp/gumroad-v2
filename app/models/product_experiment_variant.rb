# frozen_string_literal: true

class ProductExperimentVariant < ApplicationRecord
  belongs_to :product_experiment
  has_many :product_experiment_assignments, dependent: :destroy

  validates :name, presence: true
  validates :weight, numericality: { greater_than_or_equal_to: 0 }

  def conversion_rate
    return 0.0 if traffic_count.zero?
    (conversion_count.to_f / traffic_count * 100).round(2)
  end
end
