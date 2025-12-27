# frozen_string_literal: true

class Api::Internal::PostVariantsController < Api::Internal::BaseController
  before_action :authenticate_user!
  after_action :verify_authorized
  before_action :set_installment
  before_action :set_post_variant, only: %i[show update destroy]

  def index
    authorize @installment, :show?

    render json: {
      success: true,
      post_variants: @installment.post_variants.map { |v| post_variant_json(v) }
    }
  end

  def show
    authorize @installment, :show?

    render json: {
      success: true,
      post_variant: post_variant_json(@post_variant)
    }
  end

  def create
    authorize @installment, :update?

    @post_variant = @installment.post_variants.build(post_variant_params)

    if @post_variant.save
      # If this variant is set as control, unset other control variants
      if @post_variant.is_control?
        @installment.post_variants.where.not(id: @post_variant.id).update_all(is_control: false)
      end

      render json: {
        success: true,
        post_variant: post_variant_json(@post_variant)
      }
    else
      render json: {
        success: false,
        message: @post_variant.errors.full_messages.join(", ")
      }, status: :unprocessable_entity
    end
  end

  def update
    authorize @installment, :update?

    if @post_variant.update(post_variant_params)
      # If this variant is set as control, unset other control variants
      if @post_variant.is_control?
        @installment.post_variants.where.not(id: @post_variant.id).update_all(is_control: false)
      end

      render json: {
        success: true,
        post_variant: post_variant_json(@post_variant)
      }
    else
      render json: {
        success: false,
        message: @post_variant.errors.full_messages.join(", ")
      }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @installment, :update?

    if @post_variant.destroy
      render json: { success: true }
    else
      render json: {
        success: false,
        message: "Failed to delete variant"
      }, status: :unprocessable_entity
    end
  end

  private
    def set_installment
      @installment = current_seller.installments.alive.find_by_external_id(params[:installment_id])
      e404_json unless @installment
    end

    def set_post_variant
      @post_variant = @installment.post_variants.find_by_external_id(params[:id])
      e404_json unless @post_variant
    end

    def post_variant_params
      params.permit(:name, :message, :is_control)
    end

    def post_variant_json(variant)
      {
        id: variant.external_id,
        name: variant.name,
        message: variant.message,
        is_control: variant.is_control?,
        distribution_rules: variant.variant_distribution_rules.map do |rule|
          {
            id: rule.external_id,
            post_variant_id: variant.external_id,
            base_variant_id: rule.base_variant&.external_id,
            distribution_type: rule.distribution_type,
            distribution_value: rule.distribution_value
          }
        end
      }
    end
end
