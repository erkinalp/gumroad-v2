# frozen_string_literal: true

class Admin::UnreviewedUsersService
  MINIMUM_BALANCE_CENTS = 1000
  DEFAULT_CUTOFF_YEARS = 2

  attr_reader :cutoff_date

  def initialize(cutoff_date: nil)
    @cutoff_date = cutoff_date || DEFAULT_CUTOFF_YEARS.years.ago.to_date
  end

  def count
    base_scope.count.size
  end

  def users_with_unpaid_balance
    base_scope
      .order(Arel.sql("SUM(balances.amount_cents) DESC"))
      .select("users.*, SUM(balances.amount_cents) AS total_balance_cents")
  end

  def self.cached_count
    $redis.get(RedisKey.unreviewed_users_count)&.to_i
  end

  def self.cache_count!
    count = new.count
    $redis.set(RedisKey.unreviewed_users_count, count)
    count
  end

  private
    def base_scope
      User
        .joins(:balances)
        .where(user_risk_state: "not_reviewed")
        .where("users.created_at >= ?", cutoff_date)
        .merge(Balance.unpaid)
        .group("users.id")
        .having("SUM(balances.amount_cents) > ?", MINIMUM_BALANCE_CENTS)
    end
end

