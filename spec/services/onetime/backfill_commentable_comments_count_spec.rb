# frozen_string_literal: true

require "spec_helper"

RSpec.describe Onetime::BackfillCommentableCommentsCount do
  describe "#initialize" do
    it "accepts valid commentable classes" do
      expect { described_class.new(commentable_class: User) }.not_to raise_error
      expect { described_class.new(commentable_class: Link) }.not_to raise_error
      expect { described_class.new(commentable_class: Purchase) }.not_to raise_error
      expect { described_class.new(commentable_class: Installment) }.not_to raise_error
    end

    it "raises an error for invalid commentable classes" do
      expect { described_class.new(commentable_class: String) }.to raise_error(ArgumentError, "Commentable class invalid: String")
      expect { described_class.new(commentable_class: Product) }.to raise_error(ArgumentError)
    end
  end

  describe "#process" do
    let(:service) { described_class.new(commentable_class: User) }

    context "when backfilling users" do
      let!(:user_with_comments) { create(:user, comments_count: nil) }
      let!(:user_without_comments) { create(:user, comments_count: nil) }
      let!(:user_already_backfilled) { create(:user, comments_count: 5) }
      let!(:user_with_zero_comments) { create(:user, comments_count: nil) }

      before do
        create_list(:comment, 3, commentable: user_with_comments)
        user_with_comments.update_column(:comments_count, nil)
      end

      it "updates comments_count for users with nil count" do
        expect { service.process }
          .to change { user_with_comments.reload.comments_count }.from(nil).to(3)
          .and change { user_without_comments.reload.comments_count }.from(nil).to(0)
          .and change { user_with_zero_comments.reload.comments_count }.from(nil).to(0)
          .and change { user_already_backfilled.reload.comments_count }.by(0)
      end

      it "logs progress information" do
        expect(Rails.logger).to receive(:info).with(/Starting backfill for users/)
        expect(Rails.logger).to receive(:info).with(/Updated .* users \| Total progress:/)
        expect(Rails.logger).to receive(:info).with(/Completed! Updated .* users in/)

        service.process
      end
    end

    context "when backfilling products" do
      let(:service) { described_class.new(commentable_class: Link) }
      let!(:product_with_comments) { create(:product, comments_count: nil) }
      let!(:product_without_comments) { create(:product, comments_count: nil) }

      before do
        create_list(:comment, 2, commentable: product_with_comments)
        product_with_comments.update_column(:comments_count, nil)
      end

      it "updates comments_count for products" do
        expect { service.process }
          .to change { product_with_comments.reload.comments_count }.from(nil).to(2)
          .and change { product_without_comments.reload.comments_count }.from(nil).to(0)
      end
    end

    context "when backfilling purchases" do
      let(:service) { described_class.new(commentable_class: Purchase) }
      let!(:purchase_with_comments) { create(:purchase, comments_count: nil) }

      before do
        create_list(:comment, 5, commentable: purchase_with_comments)
        purchase_with_comments.update_column(:comments_count, nil)
      end

      it "updates comments_count for purchases" do
        expect { service.process }
          .to change { purchase_with_comments.reload.comments_count }.from(nil).to(5)
      end
    end

    context "when backfilling installments" do
      let(:service) { described_class.new(commentable_class: Installment) }
      let!(:installment_with_comments) { create(:installment, comments_count: nil) }

      before do
        create_list(:comment, 4, commentable: installment_with_comments)
        installment_with_comments.update_column(:comments_count, nil)
      end

      it "updates comments_count for installments" do
        expect { service.process }
          .to change { installment_with_comments.reload.comments_count }.from(nil).to(4)
      end
    end

    context "idempotency" do
      let!(:user) { create(:user, comments_count: nil) }

      before do
        create_list(:comment, 3, commentable: user)
        user.update_column(:comments_count, nil)
      end

      it "is safe to run multiple times" do
        expect { service.process }
          .to change { user.reload.comments_count }.from(nil).to(3)
        expect { service.process }
          .to change { user.reload.comments_count }.by(0)
      end

      it "can be resumed after interruption" do
        already_backfilled_user = create(:user, comments_count: 10)
        needs_backfilling_user = create(:user, comments_count: nil)
        create_list(:comment, 5, commentable: needs_backfilling_user)
        needs_backfilling_user.update_column(:comments_count, nil)
        expect { service.process }
          .to change { already_backfilled_user.reload.comments_count }.by(0)
          .and change { needs_backfilling_user.reload.comments_count }.from(nil).to(5)
      end
    end
  end
end
