# frozen_string_literal: true

require "spec_helper"
require "shared_examples/admin_base_controller_concern"

describe Admin::LinksController do
  render_views

  it_behaves_like "inherits from Admin::BaseController"

  let(:admin_user) { create(:admin_user) }
  let(:is_adult) { false }
  let(:product) { create(:product, is_adult: false) }

  before do
    sign_in admin_user
  end

  describe "POST is_adult" do
    it "updates the product's is_adult flag" do
      post :is_adult, params: { id: product.unique_permalink, is_adult: "1" }
      expect(response).to be_successful
      expect(product.reload.is_adult).to be(true)

      post :is_adult, params: { id: product.unique_permalink, is_adult: "0" }
      expect(response).to be_successful
      expect(product.reload.is_adult).to be(false)
    end
  end
end
