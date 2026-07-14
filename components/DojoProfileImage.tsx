"use client";

import Image from "next/image";
import Link from "next/link";
import { Camera } from "lucide-react";
import { useEffect, useState } from "react";
import {
  DOJO_FALLBACK_IMAGE,
  type DojoImageFit,
  type DojoImagePosition,
} from "@/lib/dojo-image";

type DojoProfileImageProps = {
  dojoName: string;
  imageUrl?: string | null;
  imageFit?: DojoImageFit;
  imagePosition?: DojoImagePosition;
  editHref?: string;
  loading?: boolean;
  priority?: boolean;
};

const positionClasses: Record<DojoImagePosition, string> = {
  top: "object-top",
  center: "object-center",
  bottom: "object-bottom",
};

export function DojoProfileImage({
  dojoName,
  imageUrl,
  imageFit = "contain",
  imagePosition = "center",
  editHref,
  loading = false,
  priority = false,
}: DojoProfileImageProps) {
  const [displayUrl, setDisplayUrl] = useState(imageUrl || DOJO_FALLBACK_IMAGE);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    setDisplayUrl(imageUrl || DOJO_FALLBACK_IMAGE);
    setImageLoading(true);
  }, [imageUrl]);

  const mainImageClass = imageFit === "cover"
    ? `object-cover ${positionClasses[imagePosition]}`
    : "object-contain object-center";

  return (
    <div className="relative h-[240px] w-full overflow-hidden rounded-2xl bg-neutral-900 md:h-[340px] lg:h-[400px]">
      {!loading ? (
        <div
          aria-hidden="true"
          className="absolute inset-[-8%] scale-110 bg-cover bg-center opacity-30 blur-2xl"
          style={{ backgroundImage: `url(${JSON.stringify(displayUrl)})` }}
        />
      ) : null}
      <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
      {loading || imageLoading ? (
        <div
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-white/[0.08]"
          role="status"
          aria-label="Loading dojo photo"
        />
      ) : null}
      {!loading ? (
        <Image
          src={displayUrl}
          alt={`${dojoName || "Dojo"} dojo profile photo`}
          fill
          unoptimized
          priority={priority}
          sizes="(max-width: 768px) 100vw, 960px"
          className={mainImageClass}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            if (displayUrl !== DOJO_FALLBACK_IMAGE) {
              setDisplayUrl(DOJO_FALLBACK_IMAGE);
              setImageLoading(true);
            } else {
              setImageLoading(false);
            }
          }}
        />
      ) : null}
      {editHref ? (
        <Link
          href={editHref}
          className="focus-ring absolute right-3 top-3 z-10 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full border border-white/20 bg-black/75 px-3 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur transition hover:border-acid/60 hover:text-acid sm:right-4 sm:top-4 sm:px-4 sm:text-sm"
          aria-label="Change dojo profile photo"
        >
          <Camera className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Change photo</span>
        </Link>
      ) : null}
    </div>
  );
}
