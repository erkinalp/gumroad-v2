# frozen_string_literal: true

module CurrencyHelper
  include BasePrice::Recurrence

  def instance_base_currency
    INSTANCE_BASE_CURRENCY
  end

  def is_crypto_currency?(currency_type)
    CRYPTO_CURRENCIES.key?(currency_type.to_s.downcase)
  end

  def get_crypto_currency_config(currency_type)
    CRYPTO_CURRENCIES[currency_type.to_s.downcase]
  end

  def currency_namespace
    Redis::Namespace.new(:currencies, redis: $redis)
  end

  def symbol_for(type = nil)
    type ||= instance_base_currency.to_sym
    currency_config = CURRENCY_CHOICES[type.to_sym] || CRYPTO_CURRENCIES[type.to_s.downcase]
    currency_config&.dig(:symbol) || currency_config&.dig("symbol")
  end

  def min_price_for(type = nil)
    type ||= instance_base_currency.to_sym
    currency_config = CURRENCY_CHOICES[type.to_sym] || CRYPTO_CURRENCIES[type.to_s.downcase]
    currency_config&.dig(:min_price) || currency_config&.dig("min_price")
  end

  def currency_choices
    CURRENCY_CHOICES.map { |k, v| [v[:display_format], k, v[:symbol]] }
  end

  def crypto_currency_choices
    CRYPTO_CURRENCIES.map { |k, v| [v[:display_format] || v["display_format"], k, v[:symbol] || v["symbol"]] }
  end

  def all_currency_choices
    currency_choices + crypto_currency_choices
  end

  def string_to_price_cents(currency_type, price_string)
    (BigDecimal(price_string.to_s.delete(",").presence || 0) * (is_currency_type_single_unit?(currency_type) ? 1 : 100)).round
  end

  def query_rate(currency_type)
    JSON.parse(URI.open(CURRENCY_SOURCE).read)["rates"][currency_type]
  rescue StandardError
    currency_namespace.get(currency_type.to_s)
  end

  def get_rate(currency_type)
    return "1.0" if currency_type.to_s.downcase == instance_base_currency
    formatted_currency = currency_type.to_s.upcase
    rate = currency_namespace.get(formatted_currency.to_s)
    if rate && rate.to_f > 0
      rate.to_f.to_s
    else
      new_rate = query_rate(formatted_currency)
      currency_namespace.set(formatted_currency.to_s, new_rate)
      new_rate.to_f.to_s
    end
  end

  def get_base_currency_units(currency_type, quantity, rate: nil)
    return quantity if currency_type.to_s.downcase == instance_base_currency
    rate = get_rate(currency_type) if rate.nil?
    converted = BigDecimal(quantity) / rate.to_f
    if is_currency_type_single_unit?(currency_type)
      (converted * 100).round
    else
      converted.round
    end
  end

  alias_method :get_base_currency_cents, :get_base_currency_units
  alias_method :get_usd_cents, :get_base_currency_units

  def base_currency_to_display_currency(currency_type, quantity, rate = nil)
    return quantity if currency_type.to_s.downcase == instance_base_currency
    conversion_rate = rate.present? ? rate.to_f : get_rate(currency_type).to_f
    converted = BigDecimal(quantity) * conversion_rate
    if is_currency_type_single_unit?(currency_type)
      (converted / 100).round
    else
      converted.round
    end
  end

  alias_method :usd_cents_to_currency, :base_currency_to_display_currency

  def formatted_base_currency_amount(amount_cents, with_currency: false, no_cents_if_whole: true)
    Money.new(amount_cents, instance_base_currency.upcase).format(with_currency:, no_cents_if_whole:)
  end

  alias_method :formatted_dollar_amount, :formatted_base_currency_amount

  def formatted_amount_in_currency(amount_cents, currency, no_cents_if_whole: true)
    Money.new(amount_cents, currency).format(symbol: false, no_cents_if_whole:, with_currency: true)
  end

  def format_just_price_in_cents(amount_cents, currency)
    price = formatted_price(currency, amount_cents)
    price == "$0.99" ? "99¢" : price
  end

  def formatted_price_with_recurrence(formatted_price, recurrence, charge_occurrence_count, format:)
    if recurrence
      formatted_price = \
        if format == :short
          "#{formatted_price} #{recurrence_short_indicator(recurrence)}"
        elsif format == :long
          "#{formatted_price} #{recurrence_long_indicator(recurrence)}"
        end
    end
    formatted_price += " x #{charge_occurrence_count}" if charge_occurrence_count.present?
    formatted_price
  end

  def formatted_price_in_currency_with_recurrence(amount_cents, currency, recurrence, charge_occurrence_count)
    formatted_price = format_just_price_in_cents(amount_cents, currency)
    formatted_price_with_recurrence(formatted_price, recurrence, charge_occurrence_count, format: :long)
  end

  def get_currency_by_type(currency_type)
    CURRENCY_CHOICES[currency_type.to_s.downcase] ||
      CRYPTO_CURRENCIES[currency_type.to_s.downcase] ||
      CURRENCY_CHOICES[instance_base_currency]
  end

  def unit_scaling_factor(currency_type)
    is_currency_type_single_unit?(currency_type) ? 1 : 100
  end

  def is_currency_type_single_unit?(currency_type = nil)
    currency_type ||= instance_base_currency
    currency_config = get_currency_by_type(currency_type)
    return false if currency_config.nil?

    currency_config.key?("single_unit") || currency_config.key?(:single_unit)
  end

  def formatted_price(currency_type, price)
    MoneyFormatter.format(price, currency_type.to_s.downcase.to_sym, no_cents_if_whole: true, symbol: true)
  end

  # Should match PriceTag component
  def product_card_formatted_price(price:, currency_code:, is_pay_what_you_want:, recurrence:, duration_in_months:)
    recurrence_label = recurrence_label(recurrence, duration_in_months)
    safe_join(
      [
        formatted_price(currency_code, price),
        (is_pay_what_you_want ? "+" : nil),
        (recurrence_label ? " #{recurrence_label}" : nil),
      ].compact
    )
  end

  # Should match formatRecurrenceWithDuration
  def recurrence_label(recurrence, duration_in_months)
    return if recurrence.blank?
    number_of_months = BasePrice::Recurrence.number_of_months_in_recurrence(recurrence)
    base_formatted_label = recurrence_long_indicator(recurrence)
    return base_formatted_label if duration_in_months.blank?

    "#{base_formatted_label} x #{(duration_in_months / number_of_months).round}"
  end
end
