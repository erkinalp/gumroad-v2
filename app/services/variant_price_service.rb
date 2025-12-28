# frozen_string_literal: true

class VariantPriceService
  BUYER_VARIANT_COOKIE_NAME = :_gumroad_buyer_variant

  attr_reader :product, :installment, :user, :buyer_cookie

  def initialize(product:, installment: nil, user: nil, buyer_cookie: nil)
    @product = product
    @installment = installment
    @user = user
    @buyer_cookie = buyer_cookie
  end

  # Returns the price override in cents if a variant with price_cents is assigned,
  # otherwise returns nil (use default product price)
  def price_override_cents
    return nil unless installment.present?

    assigned_variant = find_or_assign_variant
    return nil unless assigned_variant.present?
    return nil unless assigned_variant.price_cents.present?

    assigned_variant.price_cents
  end

  # Returns the assigned variant for this buyer/installment combination
  def assigned_variant
    return nil unless installment.present?

    find_or_assign_variant
  end

  class << self
    def generate_buyer_cookie
      SecureRandom.uuid
    end

    def get_or_create_buyer_cookie(cookies)
      existing = cookies.signed[BUYER_VARIANT_COOKIE_NAME]
      return existing if existing.present?

      new_cookie = generate_buyer_cookie
      cookies.signed[BUYER_VARIANT_COOKIE_NAME] = {
        value: new_cookie,
        expires: 1.year.from_now,
        httponly: true
      }
      new_cookie
    end
  end

  private
    def find_or_assign_variant
      @assigned_variant ||= VariantAssignment.find_or_assign_for_buyer(
        installment: installment,
        user: user,
        buyer_cookie: buyer_cookie
      )
    end
end
