import { useEffect, useRef, useState, useCallback } from "react";

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
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Callback ref to track when the element mounts/unmounts
  const setRef = useCallback((node: HTMLDivElement | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // Reset intersection state when element is removed
    if (!element) {
      setIsIntersecting(false);
      return;
    }

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
    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [element, threshold, rootMargin]);

  return { observerRef: setRef, isIntersecting };
}
