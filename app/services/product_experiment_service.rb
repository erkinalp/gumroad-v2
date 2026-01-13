# frozen_string_literal: true

class ProductExperimentService
  def initialize(product, user: nil, buyer_cookie: nil)
    @product = product
    @user = user
    @buyer_cookie = buyer_cookie
  end

  # Returns the product with overridden attributes if an experiment variant is assigned
  def call
    return @product unless @product.product_experiments.active.exists?

    # Prioritize logged-in user, then cookie
    experiment = @product.product_experiments.running.first
    return @product unless experiment

    variant = experiment.assign_variant(user: @user, buyer_cookie: @buyer_cookie)
    return @product unless variant

    apply_variant(variant)
  end

  private

  def apply_variant(variant)
    # Clone the product to avoid modifying the original and to prevent DB writes (safety)
    product_clone = @product.dup

    # Restore ID and persistence state so views/helpers treat it as the real record
    product_clone.id = @product.id
    product_clone.instance_variable_set(:@new_record, false)
    product_clone.instance_variable_set(:@destroyed, false)
    # Copy created_at/updated_at if needed, though usually not critical for display
    product_clone.created_at = @product.created_at
    product_clone.updated_at = @product.updated_at

    # Override Simple Attributes
    product_clone.description = variant.description_override if variant.description_override.present?

    # Override Price
    # We use singleton methods to bypass the complex logic in Product::Prices
    # that would otherwise fetch defaults from the DB.
    if variant.price_cents_override.present?
      override_price = variant.price_cents_override

      # Override low-level accessors
      product_clone.define_singleton_method(:price_cents) { override_price }
      product_clone.define_singleton_method(:buy_price_cents) { override_price }
      product_clone.define_singleton_method(:default_price_cents) { override_price }

      # Ensure displayed_price_cents (often used in views) matches
      product_clone.displayed_price_cents = override_price
    end

    # Tag the clone
    product_clone.instance_variable_set(:@experiment_variant, variant)

    product_clone
  end
end
