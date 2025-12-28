# frozen_string_literal: true

class VariantAssignment < ApplicationRecord
  belongs_to :post_variant
  belongs_to :subscription, optional: true
  belongs_to :user, optional: true

  validates :assigned_at, presence: true
  validates :subscription_id, uniqueness: { scope: :post_variant_id, message: "has already been assigned to this variant" }, allow_nil: true
  validates :user_id, uniqueness: { scope: :post_variant_id, message: "has already been assigned to this variant" }, allow_nil: true
  validates :buyer_cookie, uniqueness: { scope: :post_variant_id, message: "has already been assigned to this variant" }, allow_nil: true
  validate :must_have_identity

  before_validation :set_assigned_at, on: :create

  scope :for_subscription, ->(subscription_id) { where(subscription_id: subscription_id) }
  scope :for_user, ->(user_id) { where(user_id: user_id) }
  scope :for_buyer_cookie, ->(buyer_cookie) { where(buyer_cookie: buyer_cookie) }

  # Find or create an assignment for a buyer based on identity
  # Priority: user_id (logged in) > buyer_cookie (guest)
  def self.find_or_assign_for_buyer(installment:, user: nil, buyer_cookie: nil)
    return nil if user.blank? && buyer_cookie.blank?
    return nil if installment.post_variants.empty?

    post_variant_ids = installment.post_variants.pluck(:id)

    # Check for existing assignment by user_id first (most stable)
    if user.present?
      existing = where(user_id: user.id, post_variant_id: post_variant_ids).first
      return existing.post_variant if existing.present?
    end

    # Fall back to buyer_cookie for guests
    if buyer_cookie.present?
      existing = where(buyer_cookie: buyer_cookie, post_variant_id: post_variant_ids).first
      return existing.post_variant if existing.present?
    end

    # Select a variant using distribution rules
    selected_variant = installment.send(:select_variant_for_buyer)
    return nil if selected_variant.nil?

    # Create assignment with user_id if logged in, otherwise buyer_cookie
    assignment_attrs = {
      post_variant: selected_variant,
      assigned_at: Time.current
    }

    if user.present?
      assignment_attrs[:user_id] = user.id
    else
      assignment_attrs[:buyer_cookie] = buyer_cookie
    end

    create!(assignment_attrs)

    selected_variant
  end

  private
    def set_assigned_at
      self.assigned_at ||= Time.current
    end

    def must_have_identity
      identities = [subscription_id, user_id, buyer_cookie].compact
      if identities.empty?
        errors.add(:base, "Must have a subscription, user, or buyer_cookie")
      elsif identities.size > 1
        errors.add(:base, "Cannot have multiple identity types")
      end
    end
end
