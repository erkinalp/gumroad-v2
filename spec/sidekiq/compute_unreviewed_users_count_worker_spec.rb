# frozen_string_literal: true

require "spec_helper"

describe ComputeUnreviewedUsersCountWorker do
  describe "#perform" do
    it "caches the unreviewed users count via the service" do
      user = create(:user, user_risk_state: "not_reviewed", created_at: 1.year.ago)
      create(:balance, user:, amount_cents: 5000)

      described_class.new.perform

      expect(Admin::UnreviewedUsersService.cached_count).to eq(1)
    end
  end
end
