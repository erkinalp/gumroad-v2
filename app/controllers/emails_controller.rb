# frozen_string_literal: true

class EmailsController < Sellers::BaseController
  layout "inertia"

  def index
    authorize Installment

    create_user_event("emails_view")

    if request.path == emails_path
      default_tab = Installment.alive.not_workflow_installment.scheduled.where(seller: current_seller).exists? ? "scheduled" : "published"
      redirect_to "#{emails_path}/#{default_tab}", status: :moved_permanently
    else
      render inertia: "Emails/Index"
    end
  end

  private
    def set_title
      @title = "Emails"
    end
end
