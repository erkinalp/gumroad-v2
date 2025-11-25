# frozen_string_literal: true

class AddIndexToOfferCodesCreatedAt < ActiveRecord::Migration[7.1]
  def change
    add_index :offer_codes, :created_at
  end
end
