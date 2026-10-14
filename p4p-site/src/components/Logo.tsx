import { useState } from "react";
import { hostOf } from "@/data/catalog";

function initials(name: string): string {
  const words = name.replace(/[^A-Za-z0-9 ]/g, "").trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.slice(0, 3).map((w) => w[0]).join("").toUpperCase();
}

/**
 * Vendor logo. The catalog has no logo field, so we try the vendor's domain
 * logo (Clearbit) → favicon → an initials brandmark, in that order.
 */
export default function Logo({
  name,
  website,
  size = 48,
  rounded = "rounded-xl",
  className = "",
}: {
  name: string;
  website: string;
  size?: number;
  rounded?: string;
  className?: string;
}) {
  const host = hostOf(website);
  const sources = host
    ? [
        `https://logo.clearbit.com/${host}`,
        `https://www.google.com/s2/favicons?domain=${host}&sz=128`,
      ]
    : [];
  const [step, setStep] = useState(0);
  const src = sources[step];

  if (!src) {
    return (
      <div
        className={`grid shrink-0 place-items-center bg-gradient-to-br from-gold to-gold-bright font-bold text-ongold ${rounded} ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.3 }}
        aria-hidden
      >
        {initials(name)}
      </div>
    );
  }

  return (
    <div
      className={`grid shrink-0 place-items-center overflow-hidden bg-white ${rounded} ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={`${name} logo`}
        width={size}
        height={size}
        loading="lazy"
        className="h-full w-full object-contain p-1.5"
        onError={() => setStep((s) => s + 1)}
      />
    </div>
  );
}
