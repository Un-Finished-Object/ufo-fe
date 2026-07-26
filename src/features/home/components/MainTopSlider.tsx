"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ToastMessage from "@/components/common/ToastMessage";
import { useAuthState } from "@/features/auth/hooks/useAuthState";
import { useAuthRequiredToast } from "@/hooks/useAuthRequiredToast";

type BannerItem = {
  id: number;
  title: string;
  count: string;
  href?: string;
  imageSrc?: string;
};

type MainTopSliderProps = {
  posts: BannerItem[];
};

function isProtectedHref(href: string) {
  return href === "/events" || href.startsWith("/events/");
}

export default function MainTopSlider({ posts }: MainTopSliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const mouseDragRef = useRef<{
    pointerId: number;
    startX: number;
    startScrollLeft: number;
    didDrag: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMouseDragging, setIsMouseDragging] = useState(false);
  const interactedAtRef = useRef<number>(0);
  const snapTimeoutRef = useRef<number | null>(null);
  const { authStatus, isAuthenticated } = useAuthState();
  const { showAuthRequiredToast, toastMessage } = useAuthRequiredToast();

  useEffect(() => {
    if (posts.length <= 1) {
      return;
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (!trackRef.current) {
        return;
      }

      if (Date.now() - interactedAtRef.current < 2500) {
        return;
      }

      const nextIndex = (activeIndex + 1) % posts.length;
      const nextLeft = trackRef.current.clientWidth * nextIndex;

      trackRef.current.scrollTo({
        left: nextLeft,
        behavior: "smooth",
      });
      setActiveIndex(nextIndex);
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeIndex, posts.length]);

  const updateActiveIndexFromScroll = () => {
    if (!trackRef.current) {
      return;
    }

    const width = trackRef.current.clientWidth;
    if (width === 0) {
      return;
    }

    const index = Math.round(trackRef.current.scrollLeft / width);
    setActiveIndex(Math.max(0, Math.min(posts.length - 1, index)));
  };

  const markInteraction = () => {
    interactedAtRef.current = Date.now();
  };

  const snapToNearestSlide = () => {
    if (!trackRef.current) {
      return;
    }

    const width = trackRef.current.clientWidth;
    if (width === 0) {
      return;
    }

    const index = Math.round(trackRef.current.scrollLeft / width);
    const boundedIndex = Math.max(0, Math.min(posts.length - 1, index));
    const left = boundedIndex * width;

    trackRef.current.scrollTo({
      left,
      behavior: "smooth",
    });
    setActiveIndex(boundedIndex);
  };

  const handleScrollEnd = () => {
    if (snapTimeoutRef.current) {
      window.clearTimeout(snapTimeoutRef.current);
    }

    snapTimeoutRef.current = window.setTimeout(() => {
      snapToNearestSlide();
      snapTimeoutRef.current = null;
    }, 70);
  };

  const handleMousePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0 || !trackRef.current) {
      return;
    }

    markInteraction();
    suppressClickRef.current = false;
    mouseDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: trackRef.current.scrollLeft,
      didDrag: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsMouseDragging(true);
  };

  const handleMousePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = mouseDragRef.current;
    const track = trackRef.current;

    if (!drag || !track || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.startX;
    if (Math.abs(deltaX) > 4) {
      drag.didDrag = true;
      suppressClickRef.current = true;
    }

    track.scrollLeft = drag.startScrollLeft - deltaX;
  };

  const finishMouseDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = mouseDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    mouseDragRef.current = null;
    setIsMouseDragging(false);
    handleScrollEnd();
  };

  useEffect(() => {
    return () => {
      if (snapTimeoutRef.current) {
        window.clearTimeout(snapTimeoutRef.current);
      }
    };
  }, []);

  return (
    <section className="mb-6 px-4 pt-2">
      <div
        ref={trackRef}
        onScroll={updateActiveIndexFromScroll}
        onTouchStart={markInteraction}
        onTouchEnd={handleScrollEnd}
        onPointerDown={handleMousePointerDown}
        onPointerMove={handleMousePointerMove}
        onPointerUp={finishMouseDrag}
        onPointerCancel={finishMouseDrag}
        onClickCapture={(event) => {
          if (!suppressClickRef.current) return;

          event.preventDefault();
          event.stopPropagation();
          suppressClickRef.current = false;
        }}
        onDragStart={(event) => event.preventDefault()}
        className={`overflow-x-auto rounded-[24px] [scrollbar-width:none] select-none [&::-webkit-scrollbar]:hidden ${
          isMouseDragging
            ? "cursor-grabbing snap-none"
            : "cursor-grab snap-x snap-mandatory"
        }`}
      >
        <div className="flex w-full">
          {posts.map((post, index) => {
            const articleClass =
              "relative h-36 w-full shrink-0 snap-start [scroll-snap-stop:always] overflow-hidden rounded-[24px]";

            const inner = post.imageSrc ? (
              <article key={post.id} className={articleClass}>
                <Image
                  src={post.imageSrc}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
                <div className="absolute bottom-3 right-4 rounded-full bg-black/20 px-2 py-1 text-xs font-semibold text-white">
                  {index + 1} / {posts.length}
                </div>
              </article>
            ) : (
              <article
                key={post.id}
                className={`${articleClass} bg-gradient-to-r from-ufo-brand-soft via-ufo-brand to-ufo-credit/40 px-6 py-5`}
              >
                <p className="absolute bottom-5 left-6 whitespace-pre-line text-lg font-bold leading-6 text-white">
                  {post.title}
                </p>

                <div className="absolute right-24 top-6 h-20 w-14 rounded-md bg-white/45 shadow-md backdrop-blur-[2px]" />
                <div className="absolute right-12 top-6 h-20 w-14 rounded-md bg-black/15 shadow-md" />
                <div className="absolute right-0 top-0 h-24 w-16 rounded-bl-2xl bg-sky-200/80" />

                <div className="absolute bottom-3 right-4 rounded-full bg-black/20 px-2 py-1 text-xs font-semibold text-white">
                  {index + 1} / {posts.length}
                </div>
              </article>
            );

            return post.href ? (
              <Link
                key={post.id}
                href={post.href}
                onClick={(event) => {
                  if (!post.href || !isProtectedHref(post.href) || authStatus === "loading" || isAuthenticated) {
                    return;
                  }

                  event.preventDefault();
                  showAuthRequiredToast();
                }}
                className="w-full shrink-0"
              >
                {inner}
              </Link>
            ) : inner;
          })}
        </div>
      </div>
      <ToastMessage message={toastMessage} />
    </section>
  );
}
