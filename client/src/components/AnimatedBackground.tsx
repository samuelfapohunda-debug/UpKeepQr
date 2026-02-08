import { useEffect, useRef, useState } from "react";

interface AnimatedBackgroundProps {
  pattern?: "hero" | "features" | "footer";
  intensity?: "subtle" | "normal" | "prominent";
}

const HouseShield = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
  >
    <path
      d="M100 15 L170 55 L170 145 L100 185 L30 145 L30 55 Z"
      fill="currentColor"
      opacity="0.12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeOpacity="0.2"
    />
    <path
      d="M100 70 L135 95 L135 140 L65 140 L65 95 Z"
      fill="currentColor"
      opacity="0.18"
    />
    <rect x="90" y="115" width="20" height="25" rx="2" fill="currentColor" opacity="0.25" />
  </svg>
);

const WrenchShape = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M75 20 C65 10 50 12 45 22 L20 70 C17 77 20 85 28 88 C36 91 43 87 46 80 L71 32 C76 27 80 25 75 20Z"
      fill="currentColor"
      opacity="0.15"
    />
    <circle cx="72" cy="22" r="12" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1" strokeOpacity="0.15" />
  </svg>
);

const BellShape = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M50 15 Q32 15 32 38 L32 58 L22 68 L78 68 L68 58 L68 38 Q68 15 50 15 Z"
      fill="currentColor"
      opacity="0.15"
    />
    <circle cx="50" cy="76" r="6" fill="currentColor" opacity="0.2" />
    <rect x="47" y="8" width="6" height="10" rx="3" fill="currentColor" opacity="0.2" />
  </svg>
);

const CheckmarkShape = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="50" cy="50" r="40" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.12" />
    <path
      d="M30 52 L44 66 L72 34"
      stroke="currentColor"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      opacity="0.2"
    />
  </svg>
);

const GearShape = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M50 18 L55 18 L57 10 L63 10 L65 18 L70 21 L77 16 L82 21 L77 28 L80 33 L88 31 L90 37 L82 40 L82 45 L90 48 L88 54 L80 52 L77 57 L82 64 L77 69 L70 64 L65 67 L63 75 L57 75 L55 67 L50 64 L43 69 L38 64 L43 57 L40 52 L32 54 L30 48 L38 45 L38 40 L30 37 L32 31 L40 33 L43 28 L38 21 L43 16 L50 21 Z"
      fill="currentColor"
      opacity="0.1"
      stroke="currentColor"
      strokeWidth="0.5"
      strokeOpacity="0.1"
    />
    <circle cx="60" cy="42" r="12" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.12" />
  </svg>
);

const CalendarShape = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="15" y="25" width="70" height="60" rx="8" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1" strokeOpacity="0.12" />
    <rect x="15" y="25" width="70" height="18" rx="8" fill="currentColor" opacity="0.15" />
    <rect x="30" y="15" width="6" height="16" rx="3" fill="currentColor" opacity="0.15" />
    <rect x="64" y="15" width="6" height="16" rx="3" fill="currentColor" opacity="0.15" />
    <rect x="28" y="55" width="10" height="10" rx="2" fill="currentColor" opacity="0.12" />
    <rect x="45" y="55" width="10" height="10" rx="2" fill="currentColor" opacity="0.12" />
    <rect x="62" y="55" width="10" height="10" rx="2" fill="currentColor" opacity="0.12" />
  </svg>
);

export default function AnimatedBackground({ pattern = "hero", intensity = "normal" }: AnimatedBackgroundProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.1 }
    );

    if (containerRef.current) observer.observe(containerRef.current);

    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    window.addEventListener("resize", checkMobile);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      window.removeEventListener("resize", checkMobile);
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, []);

  const shouldAnimate = !prefersReducedMotion && isInView;

  const opacityMap = { subtle: 0.6, normal: 0.8, prominent: 1 };
  const containerOpacity = opacityMap[intensity];

  return (
    <div
      ref={containerRef}
      className="animated-bg-container"
      style={{ opacity: containerOpacity }}
      data-animate={shouldAnimate}
      aria-hidden="true"
      role="presentation"
    >
      {pattern === "hero" && (
        <>
          <HouseShield className="ab-shape ab-hero-shield" />
          <WrenchShape className="ab-shape ab-hero-wrench1" />
          {!isMobile && (
            <>
              <BellShape className="ab-shape ab-hero-bell" />
              <CheckmarkShape className="ab-shape ab-hero-check1" />
              <GearShape className="ab-shape ab-hero-gear" />
            </>
          )}
        </>
      )}

      {pattern === "features" && (
        <>
          <CheckmarkShape className="ab-shape ab-feat-check1" />
          <CalendarShape className="ab-shape ab-feat-calendar" />
          <BellShape className="ab-shape ab-feat-bell" />
          {!isMobile && (
            <>
              <GearShape className="ab-shape ab-feat-gear" />
              <WrenchShape className="ab-shape ab-feat-wrench" />
            </>
          )}
        </>
      )}
    </div>
  );
}
