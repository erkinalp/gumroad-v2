import React from "react";

const useRouteLoading = () => {
  const [isRouteLoading, setIsRouteLoading] = React.useState(false);

  React.useEffect(() => {
    const startHandler = (event: any) => {
      const { prefetch, preserveScroll, only = [] } = event.detail?.visit || {};
      setIsRouteLoading(!prefetch && !preserveScroll && only.length === 0);
    };

    const finishHandler = () => setIsRouteLoading(false);

    document.addEventListener("inertia:start", startHandler);
    document.addEventListener("inertia:finish", finishHandler);

    return () => {
      document.removeEventListener("inertia:start", startHandler);
      document.removeEventListener("inertia:finish", finishHandler);
    };
  }, []);

  return isRouteLoading;
};

export default useRouteLoading;
