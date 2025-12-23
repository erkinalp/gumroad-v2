# frozen_string_literal: true

class Admin::UnreviewedUsersController < Admin::BaseController
  include Pagy::Backend

  RECORDS_PER_PAGE = 100

  def index
    @title = "Unreviewed users"

    service = Admin::UnreviewedUsersService.new(cutoff_date: cutoff_date)

    @total_count = service.count

    pagination, users = pagy(
      service.users_with_unpaid_balance,
      limit: params[:per_page] || RECORDS_PER_PAGE,
      page: params[:page]
    )

    render inertia: "Admin/UnreviewedUsers/Index",
           props: {
             users: users.map { |user| Admin::UnreviewedUserPresenter.new(user).props },
             pagination: PagyPresenter.new(pagination).props.merge(limit: pagination.limit),
             total_count: @total_count,
             cutoff_date: service.cutoff_date.to_s
           }
  end

  private
    def cutoff_date
      return nil unless params[:cutoff_date].present?

      Date.parse(params[:cutoff_date])
    rescue ArgumentError
      nil
    end
end
