import { useEffect, useRef, useState } from "react";

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
}

/**
 * Custom hook for implementing infinite scroll using Intersection Observer API
 * @param options - Configuration for the intersection observer
 * @returns Object containing the observer ref and intersection state
 */
export function useInfiniteScroll(options: UseInfiniteScrollOptions = {}) {
  const { threshold = 1.0, rootMargin = "0px" } = options;
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = observerRef.current;
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
  }, [threshold, rootMargin]);

  return { observerRef, isIntersecting };
}
