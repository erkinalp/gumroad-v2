# frozen_string_literal: true

require "spec_helper"

describe KillbillChargeProcessor do
  describe ".charge_processor_id" do
    it "returns 'killbill'" do
      expect(described_class.charge_processor_id).to eq "killbill"
    end
  end

  describe "::DISPLAY_NAME" do
    it "returns 'Kill Bill'" do
      expect(described_class::DISPLAY_NAME).to eq "Kill Bill"
    end
  end

  describe "::VALID_TRANSACTION_STATUSES" do
    it "includes success and pending" do
      expect(described_class::VALID_TRANSACTION_STATUSES).to include("success", "pending")
    end
  end

  let(:killbill_merchant_account) do
    instance_double(
      MerchantAccount,
      charge_processor_id: "killbill",
      charge_processor_merchant_id: "test-account-id",
      charge_processor_api_key: "test-api-key",
      charge_processor_api_secret: "test-api-secret"
    )
  end

  let(:killbill_chargeable) do
    instance_double(
      KillbillChargeablePaymentMethod,
      payment_method_id: "test-payment-method-id",
      account_id: "test-account-id",
      zip_code: "12345",
      is_cryptocurrency?: false,
      prepare!: nil
    )
  end

  let(:mock_payment) do
    double(
      "KillBill::Client::Model::Payment",
      payment_id: "test-payment-id",
      account_id: "test-account-id",
      payment_method_id: "test-payment-method-id",
      transactions: [mock_transaction],
      payment_attempts: []
    )
  end

  let(:mock_transaction) do
    double(
      "KillBill::Client::Model::PaymentTransaction",
      transaction_id: "test-transaction-id",
      transaction_type: "PURCHASE",
      amount: 100.0,
      currency: "USD",
      status: "SUCCESS",
      properties: []
    )
  end

  let(:mock_refund_transaction) do
    double(
      "KillBill::Client::Model::PaymentTransaction",
      transaction_id: "test-refund-transaction-id",
      transaction_type: "REFUND",
      amount: 50.0,
      currency: "USD",
      status: "SUCCESS",
      properties: []
    )
  end

  describe "#get_chargeable_for_params" do
    describe "with invalid params" do
      it "returns nil" do
        expect(subject.get_chargeable_for_params({}, nil)).to be(nil)
      end
    end

    describe "with killbill_payment_method_id" do
      let(:payment_method_id) { "test-payment-method-id" }

      it "returns a chargeable payment method" do
        chargeable = subject.get_chargeable_for_params({ killbill_payment_method_id: payment_method_id }, nil)

        expect(chargeable).to be_a(KillbillChargeablePaymentMethod)
        expect(chargeable.payment_method_id).to eq(payment_method_id)
      end
    end

    describe "with killbill_payment_method_id and zip code" do
      let(:payment_method_id) { "test-payment-method-id" }

      it "returns a chargeable payment method with zip code" do
        chargeable = subject.get_chargeable_for_params(
          { killbill_payment_method_id: payment_method_id, cc_zipcode: "12345", cc_zipcode_required: "true" },
          nil
        )

        expect(chargeable).to be_a(KillbillChargeablePaymentMethod)
        expect(chargeable.zip_code).to eq("12345")
      end
    end

    describe "with is_cryptocurrency flag" do
      let(:payment_method_id) { "test-payment-method-id" }

      it "returns a chargeable payment method marked as cryptocurrency" do
        chargeable = subject.get_chargeable_for_params(
          { killbill_payment_method_id: payment_method_id, is_cryptocurrency: "true" },
          nil
        )

        expect(chargeable).to be_a(KillbillChargeablePaymentMethod)
        expect(chargeable.is_cryptocurrency).to be(true)
      end
    end
  end

  describe "#get_chargeable_for_data" do
    it "returns a chargeable credit card" do
      chargeable = subject.get_chargeable_for_data(
        "reusable-token",
        "payment-method-id",
        "fingerprint",
        nil,
        nil,
        "4242",
        16,
        "**** **** **** 4242",
        1,
        2025,
        CardType::VISA,
        "US",
        "94107",
        merchant_account: killbill_merchant_account
      )

      expect(chargeable).to be_a(KillbillChargeableCreditCard)
      expect(chargeable.reusable_token).to eq("reusable-token")
      expect(chargeable.payment_method_id).to eq("payment-method-id")
      expect(chargeable.fingerprint).to eq("fingerprint")
      expect(chargeable.last4).to eq("4242")
      expect(chargeable.expiry_month).to eq(1)
      expect(chargeable.expiry_year).to eq(2025)
      expect(chargeable.card_type).to eq(CardType::VISA)
      expect(chargeable.country).to eq("US")
      expect(chargeable.zip_code).to eq("94107")
    end
  end

  describe "#get_charge" do
    let(:payment_class) { class_double("KillBill::Client::Model::Payment").as_stubbed_const }

    describe "with an invalid charge id" do
      before do
        allow(payment_class).to receive(:find_by_id).and_raise(
          KillBill::Client::API::NotFound.new("Payment not found")
        )
      end

      it "raises a charge processor invalid request error" do
        expect do
          subject.get_charge("invalid-charge-id")
        end.to raise_error(ChargeProcessorInvalidRequestError)
      end
    end

    describe "with a valid charge id" do
      before do
        allow(payment_class).to receive(:find_by_id).and_return(mock_payment)
      end

      it "returns a KillbillCharge object" do
        charge = subject.get_charge("test-payment-id")

        expect(charge).to be_a(KillbillCharge)
        expect(charge.id).to eq("test-payment-id")
        expect(charge.charge_processor_id).to eq("killbill")
      end
    end

    describe "when the charge processor is unavailable" do
      before do
        allow(payment_class).to receive(:find_by_id).and_raise(
          KillBill::Client::API::ServiceUnavailable.new("Service unavailable")
        )
      end

      it "raises a charge processor unavailable error" do
        expect do
          subject.get_charge("test-payment-id")
        end.to raise_error(ChargeProcessorUnavailableError)
      end
    end
  end

  describe "#create_payment_intent_or_charge!" do
    let(:payment_class) { class_double("KillBill::Client::Model::Payment").as_stubbed_const }

    describe "successful charging" do
      before do
        allow(payment_class).to receive(:create).and_return(mock_payment)
      end

      it "creates a payment and returns a charge intent" do
        charge_intent = subject.create_payment_intent_or_charge!(
          killbill_merchant_account,
          killbill_chargeable,
          100_00,
          10_00,
          "product-id",
          "Test product",
          statement_description: "GUMROAD"
        )

        expect(charge_intent).to be_a(KillbillChargeIntent)
        expect(charge_intent.id).to eq("test-payment-id")
      end
    end

    describe "unsuccessful charging" do
      describe "when the charge processor is unavailable" do
        before do
          allow(payment_class).to receive(:create).and_raise(
            KillBill::Client::API::ServiceUnavailable.new("Service unavailable")
          )
        end

        it "raises a charge processor unavailable error" do
          expect do
            subject.create_payment_intent_or_charge!(
              killbill_merchant_account,
              killbill_chargeable,
              100_00,
              10_00,
              "product-id",
              "Test product",
              statement_description: "GUMROAD"
            )
          end.to raise_error(ChargeProcessorUnavailableError)
        end
      end

      describe "when the card is declined" do
        before do
          allow(payment_class).to receive(:create).and_raise(
            KillBill::Client::API::BadRequest.new("Card declined")
          )
        end

        it "raises a charge processor card error" do
          expect do
            subject.create_payment_intent_or_charge!(
              killbill_merchant_account,
              killbill_chargeable,
              100_00,
              10_00,
              "product-id",
              "Test product",
              statement_description: "GUMROAD"
            )
          end.to raise_error(ChargeProcessorCardError)
        end
      end

      describe "when there are insufficient funds" do
        before do
          allow(payment_class).to receive(:create).and_raise(
            KillBill::Client::API::BadRequest.new("Insufficient funds")
          )
        end

        it "raises a charge processor insufficient funds error" do
          expect do
            subject.create_payment_intent_or_charge!(
              killbill_merchant_account,
              killbill_chargeable,
              100_00,
              10_00,
              "product-id",
              "Test product",
              statement_description: "GUMROAD"
            )
          end.to raise_error(ChargeProcessorInsufficientFundsError)
        end
      end
    end
  end

  describe "#refund!" do
    let(:payment_class) { class_double("KillBill::Client::Model::Payment").as_stubbed_const }

    describe "when the charge processor is unavailable" do
      before do
        allow(payment_class).to receive(:find_by_id).and_raise(
          KillBill::Client::API::ServiceUnavailable.new("Service unavailable")
        )
      end

      it "raises a charge processor unavailable error" do
        expect do
          subject.refund!("test-payment-id")
        end.to raise_error(ChargeProcessorUnavailableError)
      end
    end

    describe "refunding a non-existent transaction" do
      before do
        allow(payment_class).to receive(:find_by_id).and_raise(
          KillBill::Client::API::NotFound.new("Payment not found")
        )
      end

      it "raises a charge processor invalid request error" do
        expect do
          subject.refund!("invalid-charge-id")
        end.to raise_error(ChargeProcessorInvalidRequestError)
      end
    end

    describe "fully refunding a fiat charge" do
      let(:mock_payment_with_refund) do
        double(
          "KillBill::Client::Model::Payment",
          payment_id: "test-payment-id",
          account_id: "test-account-id",
          payment_method_id: "test-payment-method-id",
          transactions: [mock_transaction, mock_refund_transaction],
          payment_attempts: [],
          refund: mock_payment
        )
      end

      before do
        allow(payment_class).to receive(:find_by_id).and_return(mock_payment)
        allow(mock_payment).to receive(:refund).and_return(mock_payment_with_refund)
      end

      it "returns a KillbillChargeRefund object" do
        refund = subject.refund!("test-payment-id")

        expect(refund).to be_a(KillbillChargeRefund)
      end
    end

    describe "partially refunding a fiat charge" do
      let(:mock_payment_with_partial_refund) do
        double(
          "KillBill::Client::Model::Payment",
          payment_id: "test-payment-id",
          account_id: "test-account-id",
          payment_method_id: "test-payment-method-id",
          transactions: [mock_transaction, mock_refund_transaction],
          payment_attempts: [],
          refund: mock_payment
        )
      end

      before do
        allow(payment_class).to receive(:find_by_id).and_return(mock_payment)
        allow(mock_payment).to receive(:refund).and_return(mock_payment_with_partial_refund)
      end

      it "returns a KillbillChargeRefund object" do
        refund = subject.refund!("test-payment-id", amount_cents: 50_00)

        expect(refund).to be_a(KillbillChargeRefund)
      end
    end

    describe "refunding an already refunded charge" do
      before do
        allow(payment_class).to receive(:find_by_id).and_return(mock_payment)
        allow(mock_payment).to receive(:refund).and_raise(
          KillBill::Client::API::BadRequest.new("Payment has already been refunded")
        )
      end

      it "raises a charge processor already refunded error" do
        expect do
          subject.refund!("test-payment-id")
        end.to raise_error(ChargeProcessorAlreadyRefundedError)
      end
    end
  end

  describe "#refund! for cryptocurrency payments" do
    let(:payment_class) { class_double("KillBill::Client::Model::Payment").as_stubbed_const }
    let(:account_class) { class_double("KillBill::Client::Model::Account").as_stubbed_const }

    let(:crypto_transaction) do
      double(
        "KillBill::Client::Model::PaymentTransaction",
        transaction_id: "test-crypto-transaction-id",
        transaction_type: "PURCHASE",
        amount: 0.01,
        currency: "BTC",
        status: "SUCCESS",
        properties: [
          { "key" => "is_cryptocurrency", "value" => "true" },
          { "key" => "wallet_address", "value" => "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2" }
        ]
      )
    end

    let(:crypto_payment) do
      double(
        "KillBill::Client::Model::Payment",
        payment_id: "test-crypto-payment-id",
        account_id: "test-account-id",
        payment_method_id: "test-payment-method-id",
        transactions: [crypto_transaction],
        payment_attempts: []
      )
    end

    let(:mock_account) do
      double(
        "KillBill::Client::Model::Account",
        account_id: "test-account-id",
        email: "test@example.com"
      )
    end

    let(:credit_transaction) do
      double(
        "KillBill::Client::Model::PaymentTransaction",
        transaction_id: "test-credit-transaction-id",
        transaction_type: "CREDIT",
        amount: 0.01,
        currency: "BTC",
        status: "SUCCESS",
        properties: [
          { "key" => "is_cryptocurrency", "value" => "true" },
          { "key" => "wallet_address", "value" => "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2" }
        ]
      )
    end

    let(:crypto_payment_with_credit) do
      double(
        "KillBill::Client::Model::Payment",
        payment_id: "test-crypto-payment-id",
        account_id: "test-account-id",
        payment_method_id: "test-payment-method-id",
        transactions: [crypto_transaction, credit_transaction],
        payment_attempts: []
      )
    end

    describe "refunding a cryptocurrency payment" do
      before do
        allow(payment_class).to receive(:find_by_id).and_return(crypto_payment)
        allow(account_class).to receive(:find_by_id).and_return(mock_account)
        allow(payment_class).to receive(:create).and_return(crypto_payment_with_credit)
      end

      it "creates a credit transaction instead of a refund" do
        expect(payment_class).to receive(:create).with(
          hash_including(
            transaction_type: "CREDIT"
          ),
          anything
        )

        refund = subject.refund!("test-crypto-payment-id")

        expect(refund).to be_a(KillbillChargeRefund)
        expect(refund.cryptocurrency_refund?).to be(true)
      end
    end
  end

  describe "#holder_of_funds" do
    let(:gumroad_merchant_account) do
      instance_double(
        MerchantAccount,
        charge_processor_id: "killbill",
        charge_processor_merchant_id: nil
      )
    end

    let(:seller_merchant_account) do
      instance_double(
        MerchantAccount,
        charge_processor_id: "killbill",
        charge_processor_merchant_id: "seller-account-id"
      )
    end

    it "returns Gumroad for Gumroad-managed accounts" do
      allow(MerchantAccount).to receive(:gumroad).and_return(gumroad_merchant_account)

      expect(subject.holder_of_funds(gumroad_merchant_account)).to eq(HolderOfFunds::GUMROAD)
    end

    it "returns Seller for seller-managed accounts" do
      allow(MerchantAccount).to receive(:gumroad).and_return(gumroad_merchant_account)

      expect(subject.holder_of_funds(seller_merchant_account)).to eq(HolderOfFunds::SELLER)
    end
  end

  describe "#transaction_url" do
    it "returns a URL to the Kill Bill dashboard" do
      url = subject.transaction_url("test-payment-id")

      expect(url).to include("test-payment-id")
      expect(url).to include("payments")
    end
  end

  describe "#setup_future_charges!" do
    let(:payment_method_class) { class_double("KillBill::Client::Model::PaymentMethod").as_stubbed_const }

    let(:mock_payment_method) do
      double(
        "KillBill::Client::Model::PaymentMethod",
        payment_method_id: "test-payment-method-id",
        account_id: "test-account-id"
      )
    end

    before do
      allow(payment_method_class).to receive(:find_by_id).and_return(mock_payment_method)
    end

    it "returns a KillbillSetupIntent" do
      setup_intent = subject.setup_future_charges!(killbill_merchant_account, killbill_chargeable)

      expect(setup_intent).to be_a(KillbillSetupIntent)
      expect(setup_intent.succeeded?).to be(true)
    end
  end

  describe "#get_charge_intent" do
    let(:payment_class) { class_double("KillBill::Client::Model::Payment").as_stubbed_const }

    before do
      allow(payment_class).to receive(:find_by_id).and_return(mock_payment)
    end

    it "returns a KillbillChargeIntent" do
      charge_intent = subject.get_charge_intent("test-payment-id", merchant_account: killbill_merchant_account)

      expect(charge_intent).to be_a(KillbillChargeIntent)
      expect(charge_intent.id).to eq("test-payment-id")
    end
  end

  describe "#confirm_payment_intent!" do
    let(:payment_class) { class_double("KillBill::Client::Model::Payment").as_stubbed_const }

    let(:mock_pending_transaction) do
      double(
        "KillBill::Client::Model::PaymentTransaction",
        transaction_id: "test-transaction-id",
        transaction_type: "AUTHORIZE",
        amount: 100.0,
        currency: "USD",
        status: "PENDING",
        properties: []
      )
    end

    let(:mock_pending_payment) do
      double(
        "KillBill::Client::Model::Payment",
        payment_id: "test-payment-id",
        account_id: "test-account-id",
        payment_method_id: "test-payment-method-id",
        transactions: [mock_pending_transaction],
        payment_attempts: [],
        capture: mock_payment
      )
    end

    before do
      allow(payment_class).to receive(:find_by_id).and_return(mock_pending_payment)
    end

    it "captures the payment and returns a KillbillChargeIntent" do
      charge_intent = subject.confirm_payment_intent!(killbill_merchant_account, "test-payment-id")

      expect(charge_intent).to be_a(KillbillChargeIntent)
    end
  end

  describe "#cancel_payment_intent!" do
    let(:payment_class) { class_double("KillBill::Client::Model::Payment").as_stubbed_const }

    let(:mock_pending_transaction) do
      double(
        "KillBill::Client::Model::PaymentTransaction",
        transaction_id: "test-transaction-id",
        transaction_type: "AUTHORIZE",
        amount: 100.0,
        currency: "USD",
        status: "PENDING",
        properties: []
      )
    end

    let(:mock_pending_payment) do
      double(
        "KillBill::Client::Model::Payment",
        payment_id: "test-payment-id",
        account_id: "test-account-id",
        payment_method_id: "test-payment-method-id",
        transactions: [mock_pending_transaction],
        payment_attempts: [],
        void: mock_payment
      )
    end

    before do
      allow(payment_class).to receive(:find_by_id).and_return(mock_pending_payment)
    end

    it "voids the payment and returns a KillbillChargeIntent" do
      charge_intent = subject.cancel_payment_intent!(killbill_merchant_account, "test-payment-id")

      expect(charge_intent).to be_a(KillbillChargeIntent)
    end
  end
end
