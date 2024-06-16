import React from "react";

type Params = {
  element: Element | null | undefined;
  rootMargin: `${number}%` | `${number}px`;
  disabled?: boolean;
};

/**
 * Returns true if the element is near to the viewport.
 *
 * Technically, it returns true iff there is a non-empty intersection area
 * between the `element` and the browser viewport expanded by `rootMargin`.
 */
export function useIsGonnaVisible({ element, rootMargin, disabled }: Params) {
  const [isGonnaVisible, setIsGonnaVisible] = React.useState(false);

  React.useEffect(() => {
    if (!element || disabled) return;

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        setIsGonnaVisible(entries.some((entry) => entry.isIntersecting));
      },
      { rootMargin, threshold: 0 }
    );

    intersectionObserver.observe(element);

    return () => {
      intersectionObserver.disconnect();
      setIsGonnaVisible(false);
    };
  }, [element, rootMargin, disabled]);

  return isGonnaVisible;
}
