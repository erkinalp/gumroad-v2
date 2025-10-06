import cx from "classnames";
import * as React from "react";

type IconProps = {
  name: IconName;
} & React.JSX.IntrinsicElements["span"];
export const Icon = ({ name, className, ...props }: IconProps) => (
  <span className={cx("icon", `icon-${name}`, className)} {...props} />
);

export const YesIcon = () => (
  <Icon name="solid-check-circle" aria-label="Yes" style={{ color: "rgb(var(--success))" }} />
);
export const NoIcon = () => <Icon name="x-circle-fill" aria-label="No" style={{ color: "rgb(var(--danger))" }} />;
export const BooleanIcon = ({ value }: { value: boolean }) => (value ? <YesIcon /> : <NoIcon />);
