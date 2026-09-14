import { useEffect, useRef, useState } from 'react';

type Direction = 'left' | 'right' | 'bottom' | 'scale';

export function useReveal<T extends HTMLElement = HTMLDivElement>(
  direction: Direction = 'bottom',
  threshold = 0.12,
) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setVisible(entry.isIntersecting));
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const transform = {
    left: 'translateX(-50px)',
    right: 'translateX(50px)',
    bottom: 'translateY(40px)',
    scale: 'scale(.92)',
  }[direction];

  return { ref, visible, transform };
}
