import React from "react";

export function useClientWidth(element: Element | null): number | undefined {
  const [value, setValue] = React.useState<number>();

  React.useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(() => {
      setValue(element.clientWidth);
    });
    observer.observe(element);
    return () => observer.unobserve(element);
  }, [element]);

  return value;
}
