# frozen_string_literal: true

class Onetime::BackfillCommentableCommentsCount < Onetime::Base
  DEFAULT_UPDATE_BATCH_SIZE = 10_000
  DEFAULT_SLEEP_TIME = 0.1

  def initialize(commentable_class:, batch_size: DEFAULT_UPDATE_BATCH_SIZE, sleep_time: DEFAULT_SLEEP_TIME)
    @commentable_class = commentable_class
    raise ArgumentError, "Commentable class invalid: #{@commentable_class}" unless @commentable_class.in?([Installment, Link, Purchase, User])
    @batch_size = batch_size
    @sleep_time = sleep_time
  end

  def process
    Rails.logger.info "Starting backfill for #{@commentable_class.model_name.plural}..."
    start_time = Time.current

    total_updated = 0
    @commentable_class.where(comments_count: nil).find_in_batches(batch_size: @batch_size) do |batch|
      batch_commentable_ids = batch.map(&:id)

      batch_comments_counts_hash = Comment.where(
        commentable_type: @commentable_class.name,
        commentable_id: batch_commentable_ids,
      ).group(:commentable_id).count

      payload = batch_commentable_ids.map do |id|
        { id: id, comments_count: batch_comments_counts_hash[id] || 0 }
      end

      @commentable_class.upsert_all(payload, update_only: [:comments_count])

      total_updated += batch_commentable_ids.size

      Rails.logger.info "Updated #{batch_commentable_ids.size} #{@commentable_class.model_name.plural} | Total progress: #{total_updated}"
      sleep(@sleep_time)
    end

    total_time = Time.current - start_time
    Rails.logger.info "Completed! Updated #{total_updated} #{@commentable_class.model_name.plural} in #{total_time.round(2)}s"
  end
end
