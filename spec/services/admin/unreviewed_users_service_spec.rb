# frozen_string_literal: true

require "spec_helper"

describe Admin::UnreviewedUsersService do
  describe "#count" do
    it "returns count of unreviewed users with unpaid balance > $10" do
      unreviewed_user = create(:user, user_risk_state: "not_reviewed", created_at: 1.year.ago)
      create(:balance, user: unreviewed_user, amount_cents: 5000)

      another_unreviewed_user = create(:user, user_risk_state: "not_reviewed", created_at: 6.months.ago)
      create(:balance, user: another_unreviewed_user, amount_cents: 3000)

      expect(described_class.new.count).to eq(2)
    end

    it "excludes users with balance <= $10" do
      user_with_low_balance = create(:user, user_risk_state: "not_reviewed", created_at: 1.year.ago)
      create(:balance, user: user_with_low_balance, amount_cents: 500)

      expect(described_class.new.count).to eq(0)
    end

    it "excludes compliant users" do
      compliant_user = create(:user, user_risk_state: "compliant", created_at: 1.year.ago)
      create(:balance, user: compliant_user, amount_cents: 5000)

      expect(described_class.new.count).to eq(0)
    end

    it "excludes users created before cutoff date" do
      old_user = create(:user, user_risk_state: "not_reviewed", created_at: 3.years.ago)
      create(:balance, user: old_user, amount_cents: 5000)

      expect(described_class.new.count).to eq(0)
    end

    it "includes old users when custom cutoff_date is provided" do
      old_user = create(:user, user_risk_state: "not_reviewed", created_at: 3.years.ago)
      create(:balance, user: old_user, amount_cents: 5000)

      expect(described_class.new(cutoff_date: 4.years.ago.to_date).count).to eq(1)
    end

    it "sums multiple balances for the same user" do
      user = create(:user, user_risk_state: "not_reviewed", created_at: 1.year.ago)
      create(:balance, user:, amount_cents: 600)
      create(:balance, user:, amount_cents: 600)

      # Total is 1200, which is > 1000 threshold
      expect(described_class.new.count).to eq(1)
    end
  end

  describe "#users_with_unpaid_balance" do
    it "returns users ordered by total balance descending" do
      low_balance_user = create(:user, user_risk_state: "not_reviewed", created_at: 1.year.ago)
      create(:balance, user: low_balance_user, amount_cents: 2000)

      high_balance_user = create(:user, user_risk_state: "not_reviewed", created_at: 1.year.ago)
      create(:balance, user: high_balance_user, amount_cents: 10000)

      users = described_class.new.users_with_unpaid_balance

      expect(users.first.id).to eq(high_balance_user.id)
      expect(users.last.id).to eq(low_balance_user.id)
    end

    it "includes total_balance_cents attribute" do
      user = create(:user, user_risk_state: "not_reviewed", created_at: 1.year.ago)
      create(:balance, user:, amount_cents: 5000)

      result = described_class.new.users_with_unpaid_balance.first

      expect(result.total_balance_cents).to eq(5000)
    end
  end

  describe ".cached_count" do
    it "returns the cached count from Redis" do
      $redis.set(RedisKey.unreviewed_users_count, 42)

      expect(described_class.cached_count).to eq(42)
    end

    it "returns nil when no cached value exists" do
      $redis.del(RedisKey.unreviewed_users_count)

      expect(described_class.cached_count).to be_nil
    end
  end

  describe ".cache_count!" do
    it "computes and stores count in Redis" do
      user = create(:user, user_risk_state: "not_reviewed", created_at: 1.year.ago)
      create(:balance, user:, amount_cents: 5000)

      result = described_class.cache_count!

      expect(result).to eq(1)
      expect($redis.get(RedisKey.unreviewed_users_count)).to eq("1")
    end
  end

  describe "#cutoff_date" do
    it "defaults to 2 years ago" do
      service = described_class.new

      expect(service.cutoff_date).to eq(2.years.ago.to_date)
    end

    it "uses provided cutoff_date" do
      custom_date = Date.new(2020, 1, 1)
      service = described_class.new(cutoff_date: custom_date)

      expect(service.cutoff_date).to eq(custom_date)
    end
  end
end

