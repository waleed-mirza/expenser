import { useEffect, useState, useCallback } from "react";

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
}

/**
 * Custom hook for implementing infinite scroll using Intersection Observer API
 * @param options - Configuration for the intersection observer
 * @returns Object containing the observer ref callback and intersection state
 */
export function useInfiniteScroll(options: UseInfiniteScrollOptions = {}) {
  const { threshold = 1.0, rootMargin = "0px" } = options;
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [element, setElement] = useState<HTMLDivElement | null>(null);

  // Callback ref to track when the element mounts/unmounts. Reset the
  // intersection state here (not in the effect) when the element is removed.
  const setRef = useCallback((node: HTMLDivElement | null) => {
    setElement(node);
    if (!node) setIsIntersecting(false);
  }, []);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, threshold, rootMargin]);

  return { observerRef: setRef, isIntersecting };
}
