'use client';

import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Scroll-reveal wrapper.
 *
 * `useReducedMotion` is honoured explicitly: when a visitor asks for reduced motion the
 * element is rendered in its final state rather than animated faster. Content must never
 * depend on an animation having run.
 */
export function Reveal({
  children,
  delay = 0,
  y = 16,
  className,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: '-60px' });
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Staggered children — used for card grids so items cascade rather than pop together. */
export function RevealGroup({
  children,
  className,
  stagger = 0.07,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{ visible: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 18 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Count-up statistic. Numbers animate from zero when scrolled into view, which draws the
 * eye to the figures that matter on the landing page.
 */
export function CountUp({
  value,
  suffix = '',
  duration = 1.6,
  className,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduced = useReducedMotion();

  const formatted = new Intl.NumberFormat('en').format(value);

  if (reduced) {
    return (
      <span ref={ref} className={className}>
        {formatted}
        {suffix}
      </span>
    );
  }

  return (
    <span ref={ref} className={className}>
      <motion.span
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.3 }}
      >
        {inView ? <Counter value={value} duration={duration} /> : 0}
      </motion.span>
      {suffix}
    </span>
  );
}

function Counter({ value, duration }: { value: number; duration: number }) {
  // A short, dependency-free tween: framer's animate() would work but this keeps the
  // component tree free of extra motion values for a purely decorative effect.
  //
  // The tween runs in an effect rather than during render. It used to start the animation
  // frame loop inline in the component body, guarded by a ref — which worked, but mutated
  // a ref and scheduled a side effect during render. Under StrictMode's double-render that
  // starts two competing loops writing to the same node, and it is precisely the pattern
  // concurrent rendering is allowed to break.
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let frame = 0;
    const start = performance.now();
    const format = new Intl.NumberFormat('en');

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = format.format(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    // Cancelling on unmount stops a second mount from racing the first one's loop.
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <span ref={ref}>0</span>;
}
