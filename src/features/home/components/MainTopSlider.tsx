"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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

export default function MainTopSlider({ posts }: MainTopSliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const interactedAtRef = useRef<number>(0);
  const snapTimeoutRef = useRef<number | null>(null);

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
        onMouseDown={markInteraction}
        onMouseUp={handleScrollEnd}
        className="overflow-x-auto rounded-[24px] [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
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
                className={`${articleClass} bg-gradient-to-r from-[#f2bcc8] via-[#f1b8be] to-[#e4e1a8] px-6 py-5`}
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
              <Link key={post.id} href={post.href} className="w-full shrink-0">
                {inner}
              </Link>
            ) : inner;
          })}
        </div>
      </div>
    </section>
  );
}
