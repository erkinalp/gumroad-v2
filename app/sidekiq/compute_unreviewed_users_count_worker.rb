# frozen_string_literal: true

class ComputeUnreviewedUsersCountWorker
  include Sidekiq::Job
  sidekiq_options retry: 2, queue: :low

  def perform
    Admin::UnreviewedUsersService.cache_count!
  end
end
