import * as React from "react";

import { Button } from "$app/components/Button";
import { Icon } from "$app/components/Icons";
import { Popover } from "$app/components/Popover";
import { useOriginalLocation } from "$app/components/useOriginalLocation";
import { WithTooltip } from "$app/components/WithTooltip";
import { useForm } from "@inertiajs/react";

type Props = { card_types: { id: string; name: string }[] };
export const SearchPopover = ({ card_types }: Props) => {
  const searchParams = new URL(useOriginalLocation()).searchParams;
  const [open, setOpen] = React.useState(false);

  const { data, setData, get } = useForm({
    userInput: "",
    purchaseInput: "",
    affiliateInput: "",
    query: searchParams.get("query") || "",
    card_type: searchParams.get("card_type") || "",
    transaction_date: searchParams.get("transaction_date") || "",
    last_4: searchParams.get("last_4") || "",
    expiry_date: searchParams.get("expiry_date") || "",
    price: searchParams.get("price") || "",
  });

  const onUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData("query", e.target.value);
  };

  const onSearchUsersFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setData("query", data.userInput);
    get(Routes.admin_search_users_path());
  };

  const onPurchaseInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData("query", e.target.value);
  };

  const onSearchPurchasesFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setData("query", data.purchaseInput);
    get(Routes.admin_search_purchases_path());
  };

  const onAffiliateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData("query", e.target.value);
  };

  const onSearchAffiliatesFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setData("query", data.affiliateInput);
    get(Routes.admin_affiliates_path());
  };

  const onCardTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setData("card_type", e.target.value);
  };

  const onTransactionDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData("transaction_date", e.target.value);
  };

  const onLast4Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData("last_4", e.target.value);
  };

  const onExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData("expiry_date", e.target.value);
  };

  const onPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData("price", e.target.value);
  };

  const onSearchCardsFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    get(Routes.admin_cards_path());
  };

  return (
    <Popover
      open={open}
      onToggle={setOpen}
      aria-label="Toggle Search"
      trigger={
        <WithTooltip tip="Search" position="bottom">
          <div className="button">
            <Icon name="solid-search" />
          </div>
        </WithTooltip>
      }
    >
      <div className="grid gap-3 max-w-full w-96">
        <form onSubmit={onSearchUsersFormSubmit} className="input-with-button">
          <div className="input">
            <Icon name="person" />
            <input
              autoFocus
              name="query"
              placeholder="Search users (email, name, ID)"
              type="text"
              defaultValue={data.userInput}
              onChange={onUserInputChange}
            />
          </div>
          <Button color="primary" type="submit">
            <Icon name="solid-search" />
          </Button>
        </form>

        <form onSubmit={onSearchPurchasesFormSubmit} className="input-with-button">
          <div className="input">
            <Icon name="solid-currency-dollar" />
            <input
              name="query"
              placeholder="Search purchases (email, IP, card, external ID)"
              type="text"
              defaultValue={data.query}
              onChange={onPurchaseInputChange}
            />
          </div>
          <Button color="primary" type="submit">
            <Icon name="solid-search" />
          </Button>
        </form>

        <form onSubmit={onSearchAffiliatesFormSubmit} className="input-with-button">
          <div className="input">
            <Icon name="people-fill" />
            <input
              name="query"
              placeholder="Search affiliates (email, name, ID)"
              type="text"
              defaultValue={data.affiliateInput}
              onChange={onAffiliateInputChange}
            />
          </div>
          <Button color="primary" type="submit">
            <Icon name="solid-search" />
          </Button>
        </form>
        <div role="separator">or search by card</div>
        <form onSubmit={onSearchCardsFormSubmit} className="contents">
          <select name="card_type" defaultValue={data.card_type} onChange={onCardTypeChange}>
            <option>Choose card type</option>
            {card_types.map((cardType) => (
              <option key={cardType.id} value={cardType.id}>
                {cardType.name}
              </option>
            ))}
          </select>

          <div className="input">
            <Icon name="calendar-all" />
            <input
              name="transaction_date"
              placeholder="Date (02/22/2022)"
              type="text"
              defaultValue={data.transaction_date}
              onChange={onTransactionDateChange}
            />
          </div>
          <div className="input">
            <Icon name="lock-fill" />
            <input
              name="last_4"
              placeholder="Last 4 (7890)"
              type="number"
              defaultValue={data.last_4}
              onChange={onLast4Change}
            />
          </div>
          <div className="input">
            <Icon name="outline-credit-card" />
            <input
              name="expiry_date"
              placeholder="Expiry (02/22)"
              type="text"
              defaultValue={data.expiry_date}
              onChange={onExpiryDateChange}
            />
          </div>
          <div className="input">
            <div className="pill">$</div>
            <input
              name="price"
              placeholder="Price (9.99)"
              type="number"
              step="0.01"
              defaultValue={data.price}
              onChange={onPriceChange}
            />
          </div>
          <Button color="primary" type="submit">
            Search
          </Button>
        </form>
      </div>
    </Popover>
  );
};

export default SearchPopover;
