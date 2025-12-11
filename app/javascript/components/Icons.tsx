import cx from "classnames";
import * as React from "react";

import { iconClasses, type IconName } from "../data/generated-icons";

export type { IconName } from "../data/generated-icons";

type IconProps = {
  name: IconName;
} & React.JSX.IntrinsicElements["span"];

export const Icon = ({ name, className, ...props }: IconProps) => (
  <span
    className={cx(
      "inline-block min-h-[max(1lh,1em)] w-[1em] shrink-0 bg-current [mask-size:120%] [mask-position:center] [mask-repeat:no-repeat]",
      "after:content-['\\00a0']",
      iconClasses[name],
      className,
    )}
    {...props}
  />
);
