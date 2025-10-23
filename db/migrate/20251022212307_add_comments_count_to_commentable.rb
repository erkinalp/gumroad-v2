# frozen_string_literal: true

class AddCommentsCountToCommentable < ActiveRecord::Migration[7.1]
  def change
    add_column :installments, :comments_count, :integer
    add_column :links, :comments_count, :integer
    add_column :purchases, :comments_count, :integer
    add_column :users, :comments_count, :integer
  end
end
