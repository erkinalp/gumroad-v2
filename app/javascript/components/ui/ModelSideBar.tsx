import * as React from "react";

import { classNames } from "$app/utils/classNames";

import { Icon } from "$app/components/Icons";

type ModelSideBarProps = {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  open: boolean;
  onClose: () => void;
  top?: string;
};

export const ModelSideBar = ({ children, className, ariaLabel, open, onClose, top }: ModelSideBarProps) => (
  <div className="z-modal fixed inset-0 bg-black/80" style={top ? { top } : undefined} hidden={!open}>
    <button className="absolute top-4 right-4 text-xl" onClick={onClose} aria-label="Close">
      <Icon name="x" className="text-white" />
    </button>
    {React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        const childClassName = typeof child.props.className === "string" ? child.props.className : "";
        const props: Record<string, unknown> = {
          className: classNames(
            "fixed left-0 top-0 bottom-0 flex w-80 max-w-[calc(100vw-3.25rem)] flex-col overflow-x-hidden overflow-y-auto bg-white dark:bg-dark-gray",
            childClassName,
            className,
          ),
          "aria-label": ariaLabel,
        };
        return React.cloneElement(child, props);
      }
      return child;
    })}
  </div>
);
