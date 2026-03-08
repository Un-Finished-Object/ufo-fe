import Image from "next/image";
import Link from "next/link";
import HeartIcon, { type HeartIconVariant } from "@/components/icons/HeartIcon";

export type PatternCardImageRatio = "1:1" | "4:5" | "5:4";

type PatternCardProps = {
  imageSrc: string;
  imageRatio: PatternCardImageRatio;
  title: string;
  author: string;
  patternId?: number;
  alt?: string;
  heartVariant?: HeartIconVariant;
  heartClassName?: string;
  titleClassName?: string;
  authorClassName?: string;
};

const imageRatioClassMap: Record<PatternCardImageRatio, string> = {
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]",
  "5:4": "aspect-[5/4]",
};

export default function PatternCard({
  imageSrc,
  imageRatio,
  title,
  author,
  patternId,
  alt,
  heartVariant,
  heartClassName = "h-5 w-5 stroke-white fill-white",
  titleClassName = "truncate text-[13px] font-semibold",
  authorClassName = "text-[10px] text-ufo-text-neutral",
}: PatternCardProps) {
  const content = (
    <>
      <div
        className={`relative mb-2 w-full overflow-hidden rounded-2xl ${imageRatioClassMap[imageRatio]}`}
      >
        <Image src={imageSrc} alt={alt ?? `${title} image`} fill className="object-cover" />
        {heartVariant ? (
          <div className="absolute bottom-2 right-2">
            <HeartIcon variant={heartVariant} className={heartClassName} />
          </div>
        ) : null}
      </div>
      <p className={titleClassName}>{title}</p>
      <p className={authorClassName}>{author}</p>
    </>
  );

  if (patternId !== undefined) {
    return (
      <Link href={`/patterns/${patternId}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
