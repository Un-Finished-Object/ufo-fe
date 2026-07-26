"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import CreditBadge from "@/components/credits/CreditBadge";
import { SIGNUP_REWARD_CREDITS } from "@/features/onboarding/lib/signupWelcome";

const fireworkBursts = [
  { position: "left-[12%] top-[15%]", delay: "0s", duration: "2.1s", distance: "clamp(-68px, -15vw, -48px)" },
  { position: "right-[10%] top-[12%]", delay: "0.42s", duration: "2.6s", distance: "clamp(-76px, -17vw, -54px)" },
  { position: "left-[22%] top-[38%]", delay: "0.85s", duration: "2.3s", distance: "clamp(-60px, -13vw, -42px)" },
  { position: "right-[18%] top-[40%]", delay: "1.2s", duration: "2.8s", distance: "clamp(-72px, -16vw, -50px)" },
  { position: "left-[13%] bottom-[16%]", delay: "1.55s", duration: "2.5s", distance: "clamp(-66px, -14vw, -46px)" },
  { position: "right-[11%] bottom-[13%]", delay: "0.65s", duration: "2.2s", distance: "clamp(-74px, -17vw, -52px)" },
] as const;

const particleColors = ["bg-ufo-brand", "bg-ufo-credit", "bg-white", "bg-ufo-brand-soft"] as const;
const confettiColors = ["bg-ufo-brand", "bg-ufo-credit", "bg-white", "bg-ufo-brand-soft"] as const;

const confettiPieces = Array.from({ length: 22 }, (_, index) => ({
  left: `${3 + ((index * 41) % 94)}%`,
  delay: `${-((index * 0.47) % 6).toFixed(2)}s`,
  duration: `${(4.2 + (index % 5) * 0.48).toFixed(2)}s`,
  drift: `${((index % 7) - 3) * 13}px`,
  spin: `${240 + (index % 6) * 95}deg`,
}));

const twinkles = Array.from({ length: 14 }, (_, index) => ({
  left: `${5 + ((index * 29) % 90)}%`,
  top: `${5 + ((index * 43) % 88)}%`,
  delay: `${-((index * 0.31) % 2.4).toFixed(2)}s`,
  duration: `${(1.35 + (index % 4) * 0.28).toFixed(2)}s`,
}));

type InteractiveBurst = {
  id: number;
  x: number;
  y: number;
};

type SignupWelcomeDialogProps = {
  onClose: () => void;
};

export default function SignupWelcomeDialog({ onClose }: SignupWelcomeDialogProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const celebrationLayerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const trailParticleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const animationFrameRef = useRef<number | null>(null);
  const latestPointerRef = useRef({ x: 0, y: 0 });
  const previousPointerRef = useRef({ x: 0, y: 0, time: 0 });
  const lastTrailPointRef = useRef({ x: 0, y: 0 });
  const trailIndexRef = useRef(0);
  const isPointerDownRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const nextBurstIdRef = useRef(0);
  const burstTimeoutsRef = useRef<Set<number>>(new Set());
  const [interactiveBursts, setInteractiveBursts] = useState<InteractiveBurst[]>([]);

  useEffect(() => {
    const previouslyFocusedElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    startButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocusedElement?.focus();
    };
  }, []);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => {
      reducedMotionRef.current = motionQuery.matches;
    };

    updateMotionPreference();
    motionQuery.addEventListener("change", updateMotionPreference);

    return () => motionQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    const burstTimeouts = burstTimeoutsRef.current;

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      burstTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  const getLayerPosition = (clientX: number, clientY: number) => {
    const layerRect = celebrationLayerRef.current?.getBoundingClientRect();
    if (!layerRect) return null;

    return {
      x: Math.min(layerRect.width, Math.max(0, clientX - layerRect.left)),
      y: Math.min(layerRect.height, Math.max(0, clientY - layerRect.top)),
      width: layerRect.width,
      height: layerRect.height,
    };
  };

  const activateTrailParticle = (x: number, y: number) => {
    const particle = trailParticleRefs.current[trailIndexRef.current % trailParticleRefs.current.length];
    trailIndexRef.current += 1;
    if (!particle) return;

    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.classList.remove("is-active");
    void particle.offsetWidth;
    particle.classList.add("is-active");
  };

  const updatePointerEffects = () => {
    animationFrameRef.current = null;
    if (reducedMotionRef.current) return;

    const root = rootRef.current;
    const position = getLayerPosition(latestPointerRef.current.x, latestPointerRef.current.y);
    if (!root || !position) return;

    const normalizedX = (position.x / position.width - 0.5) * 2;
    const normalizedY = (position.y / position.height - 0.5) * 2;
    root.style.setProperty("--signup-pointer-x", `${position.x}px`);
    root.style.setProperty("--signup-pointer-y", `${position.y}px`);
    root.style.setProperty("--signup-parallax-x", `${normalizedX * 10}px`);
    root.style.setProperty("--signup-parallax-y", `${normalizedY * 8}px`);

    const cardRect = cardRef.current?.getBoundingClientRect();
    if (cardRect) {
      const horizontalDistance = Math.max(cardRect.left - latestPointerRef.current.x, 0, latestPointerRef.current.x - cardRect.right);
      const verticalDistance = Math.max(cardRect.top - latestPointerRef.current.y, 0, latestPointerRef.current.y - cardRect.bottom);
      const distance = Math.hypot(horizontalDistance, verticalDistance);
      const proximity = Math.max(0, 1 - distance / 120);
      root.style.setProperty("--signup-card-glow-opacity", `${0.22 + proximity * 0.66}`);
      root.style.setProperty("--signup-festival-scale", `${1 + proximity * 0.035}`);
    }

    const now = performance.now();
    const previousPointer = previousPointerRef.current;
    const elapsed = Math.max(1, now - previousPointer.time);
    const traveled = Math.hypot(position.x - previousPointer.x, position.y - previousPointer.y);
    const trailDistance = Math.hypot(
      position.x - lastTrailPointRef.current.x,
      position.y - lastTrailPointRef.current.y,
    );

    if (isPointerDownRef.current && traveled / elapsed > 0.35 && trailDistance > 14) {
      activateTrailParticle(position.x, position.y);
      lastTrailPointRef.current = { x: position.x, y: position.y };
    }

    previousPointerRef.current = { x: position.x, y: position.y, time: now };
  };

  const schedulePointerEffects = (clientX: number, clientY: number) => {
    latestPointerRef.current = { x: clientX, y: clientY };
    if (animationFrameRef.current === null) {
      animationFrameRef.current = window.requestAnimationFrame(updatePointerEffects);
    }
  };

  const addInteractiveBurst = (x: number, y: number) => {
    const id = nextBurstIdRef.current + 1;
    nextBurstIdRef.current = id;
    setInteractiveBursts((bursts) => [...bursts.slice(-3), { id, x, y }]);

    const timeoutId = window.setTimeout(() => {
      setInteractiveBursts((bursts) => bursts.filter((burst) => burst.id !== id));
      burstTimeoutsRef.current.delete(timeoutId);
    }, 1100);
    burstTimeoutsRef.current.add(timeoutId);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reducedMotionRef.current) return;
    if (event.target instanceof Element && event.target.closest(".signup-welcome-card")) return;

    const position = getLayerPosition(event.clientX, event.clientY);
    if (!position) return;

    isPointerDownRef.current = true;
    previousPointerRef.current = { x: position.x, y: position.y, time: performance.now() };
    lastTrailPointRef.current = { x: position.x, y: position.y };
    event.currentTarget.setPointerCapture(event.pointerId);
    addInteractiveBurst(position.x, position.y);
    schedulePointerEffects(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    schedulePointerEffects(event.clientX, event.clientY);
  };

  const stopPointerTrail = () => {
    isPointerDownRef.current = false;
  };

  const resetPointerEffects = () => {
    stopPointerTrail();
    rootRef.current?.style.setProperty("--signup-parallax-x", "0px");
    rootRef.current?.style.setProperty("--signup-parallax-y", "0px");
    rootRef.current?.style.setProperty("--signup-card-glow-opacity", "0.22");
    rootRef.current?.style.setProperty("--signup-festival-scale", "1");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      startButtonRef.current?.focus();
    }
  };

  return (
    <div
      ref={rootRef}
      className="signup-welcome-dialog fixed inset-0 z-[70] flex touch-none select-none items-center justify-center overflow-hidden bg-black/65 px-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signup-welcome-title"
      aria-describedby="signup-welcome-description"
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopPointerTrail}
      onPointerCancel={stopPointerTrail}
      onPointerLeave={resetPointerEffects}
    >
      <div
        ref={celebrationLayerRef}
        className="pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 overflow-hidden"
        aria-hidden="true"
      >
        <div className="signup-pointer-glow absolute inset-0" />
        <div className="signup-festival-scene absolute inset-0">
          <div className="signup-ambient-glow signup-ambient-glow-pink" />
          <div className="signup-ambient-glow signup-ambient-glow-cyan" />

          {confettiPieces.map((piece, index) => (
            <span
              key={index}
              className={`signup-confetti absolute ${confettiColors[index % confettiColors.length]}`}
              style={
                {
                  left: piece.left,
                  "--confetti-delay": piece.delay,
                  "--confetti-duration": piece.duration,
                  "--confetti-drift": piece.drift,
                  "--confetti-spin": piece.spin,
                } as CSSProperties
              }
            />
          ))}

          {twinkles.map((twinkle, index) => (
            <span
              key={index}
              className="signup-twinkle absolute text-white"
              style={
                {
                  left: twinkle.left,
                  top: twinkle.top,
                  "--twinkle-delay": twinkle.delay,
                  "--twinkle-duration": twinkle.duration,
                } as CSSProperties
              }
            />
          ))}

          {fireworkBursts.map((burst, burstIndex) => (
            <span
              key={burst.position}
              className={`signup-firework-burst absolute ${burst.position}`}
              style={
                {
                  "--firework-delay": burst.delay,
                  "--firework-duration": burst.duration,
                  "--firework-distance": burst.distance,
                } as CSSProperties
              }
            >
              {Array.from({ length: 12 }, (_, particleIndex) => (
                <span
                  key={particleIndex}
                  className={`signup-firework-particle ${particleColors[(burstIndex + particleIndex) % particleColors.length]}`}
                  style={{ "--firework-angle": `${particleIndex * 30}deg` } as CSSProperties}
                />
              ))}
            </span>
          ))}
        </div>

        {interactiveBursts.map((burst) => (
          <span
            key={burst.id}
            className="signup-interactive-burst absolute"
            style={{ left: burst.x, top: burst.y } as CSSProperties}
          >
            {Array.from({ length: 16 }, (_, particleIndex) => (
              <span
                key={particleIndex}
                className={`signup-interactive-burst-particle ${particleColors[particleIndex % particleColors.length]}`}
                style={
                  {
                    "--interactive-angle": `${particleIndex * 22.5}deg`,
                    "--interactive-distance": `-${58 + (particleIndex % 4) * 8}px`,
                  } as CSSProperties
                }
              />
            ))}
          </span>
        ))}

        {Array.from({ length: 24 }, (_, index) => (
          <span
            key={index}
            ref={(element) => {
              trailParticleRefs.current[index] = element;
            }}
            className={`signup-pointer-trail-particle absolute ${particleColors[index % particleColors.length]}`}
            style={
              {
                "--trail-drift-x": `${((index % 5) - 2) * 9}px`,
                "--trail-drift-y": `${-18 - (index % 4) * 7}px`,
                "--trail-rotation": `${90 + (index % 6) * 45}deg`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-[344px]">
        <div className="signup-card-glow pointer-events-none absolute -inset-3 rounded-[28px]" aria-hidden="true" />
        <div
          ref={cardRef}
          className="signup-welcome-card relative w-full overflow-hidden rounded-2xl border border-ufo-border-light bg-ufo-surface px-6 pb-6 pt-8 text-center shadow-lg"
        >
          <Image
            src="/ufo_pk.webp"
            alt="UFO"
            width={162}
            height={120}
            priority
            className="mx-auto h-6 w-auto"
          />
          <h2 id="signup-welcome-title" className="mt-5 text-2xl font-bold leading-8 tracking-tight text-ufo-text">
            회원이 되신 것을
            <span className="block">환영해요!</span>
          </h2>
          <p id="signup-welcome-description" className="mt-3 text-sm leading-6 text-ufo-text-secondary">
            가입 축하 선물로
            <span className="mx-1 font-bold text-ufo-text">{SIGNUP_REWARD_CREDITS} 크레딧</span>이
            지급되었어요.
          </p>
          <div className="mt-4 flex justify-center">
            <CreditBadge
              credits={SIGNUP_REWARD_CREDITS}
              className="bg-ufo-credit px-3 py-1.5 text-xs font-bold text-ufo-text"
              circleClassName="text-ufo-surface"
              starClassName="text-ufo-credit"
            />
          </div>
          <button
            ref={startButtonRef}
            type="button"
            onClick={onClose}
            className="signup-welcome-button mt-6 h-12 w-full rounded-xl bg-ufo-brand text-base font-bold text-white shadow-md transition-colors hover:bg-ufo-brand-soft hover:text-ufo-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ufo-brand"
          >
            가이드 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
