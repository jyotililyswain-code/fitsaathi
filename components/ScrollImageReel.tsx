"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const images = [
  ["/scroll-art/karate-silhouette.jpg", "Karate silhouette"],
  ["/scroll-art/karate-punch-man.jpg", "Karate punch"],
  ["/scroll-art/karate-punch-woman.jpg", "Karate stance"],
  ["/scroll-art/ink-kick.jpg", "Ink martial arts kick"],
  ["/scroll-art/green-kick.jpg", "Green martial arts kick"],
  ["/scroll-art/dumbbell.jpg", "Dumbbell"]
];

export function ScrollImageReel() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["8%", "-42%"]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-2, 2]);

  return (
    <section ref={ref} className="relative overflow-hidden border-y border-white/10 bg-white/[0.03] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm text-acid">Scroll motion gallery</p>
        <h2 className="mt-2 text-3xl font-bold text-white">Training energy that moves with you</h2>
      </div>
      <motion.div style={{ x, rotate }} className="mt-8 flex w-max gap-5 px-4 will-change-transform">
        {images.map(([src, alt], index) => (
          <div key={src} className="relative h-56 w-56 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white">
            <Image src={src} alt={alt} fill sizes="224px" className="object-contain p-3" priority={index < 2} />
          </div>
        ))}
      </motion.div>
    </section>
  );
}
