import { useState } from "react";
import { VIDEO_CATEGORIES, type VideoItem } from "@/data/videos";
import Reveal from "./Reveal";
import { PlayIcon } from "./icons";

/** Resolve a host-agnostic clip to an iframe src, or null if none set. */
function embedUrl(v: VideoItem): string | null {
  if (v.drive) return `https://drive.google.com/file/d/${v.drive}/preview`;
  if (v.embed) return v.embed;
  if (v.videoId) {
    if (v.provider === "vimeo") return `https://player.vimeo.com/video/${v.videoId}`;
    return `https://www.youtube-nocookie.com/embed/${v.videoId}`;
  }
  return null;
}

/** A lightweight poster image for the clip (so we don't load 54 players up front). */
function posterUrl(v: VideoItem): string | null {
  if (v.drive) return `https://drive.google.com/thumbnail?id=${v.drive}&sz=w800`;
  if (v.videoId && v.provider !== "vimeo") return `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;
  return null;
}

function PlayBadge() {
  return (
    <span className="pointer-events-none absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-accent shadow-cardlg transition group-hover:scale-110">
      <PlayIcon size={22} className="ml-0.5" />
    </span>
  );
}

function VideoCard({ v }: { v: VideoItem }) {
  const url = embedUrl(v);
  const [open, setOpen] = useState(false);
  const [posterOk, setPosterOk] = useState(true);
  const poster = posterUrl(v);

  return (
    <figure className="overflow-hidden rounded-2xl border border-line bg-panel shadow-card">
      <div className="relative aspect-video w-full bg-bg-2">
        {v.file ? (
          <video
            className="absolute inset-0 h-full w-full bg-black"
            src={v.file}
            title={v.title}
            controls
            preload="none"
            playsInline
          />
        ) : url && open ? (
          // Player loads only after the user taps — keeps the page fast.
          <iframe
            className="absolute inset-0 h-full w-full"
            src={url}
            title={v.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : url ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`Play ${v.title}`}
            className="group absolute inset-0 h-full w-full"
          >
            {poster && posterOk ? (
              <img
                src={poster}
                alt=""
                loading="lazy"
                onError={() => setPosterOk(false)}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-bg-2 to-panel" />
            )}
            <span className="absolute inset-0 bg-black/15 transition group-hover:bg-black/5" />
            <PlayBadge />
          </button>
        ) : (
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-gold/40 bg-gold/10 text-accent">
                <PlayIcon size={20} className="ml-0.5" />
              </div>
              <p className="mt-3 px-4 text-xs text-muted">Video coming soon</p>
            </div>
          </div>
        )}
      </div>
      <figcaption className="px-4 py-3">
        <h4 className="text-sm font-semibold leading-snug">{v.title}</h4>
        {v.blurb && <p className="mt-1 text-xs text-muted">{v.blurb}</p>}
      </figcaption>
    </figure>
  );
}

export default function VideoSection() {
  return (
    <section id="videos" className="border-t border-line bg-bg-2/40 py-16 md:py-20">
      <div className="container-p4p">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="section-eyebrow">Learn from Dave</span>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
            The video library
          </h2>
          <p className="mt-3 text-muted">
            Everything from the original site, reorganized and easier to browse.
          </p>
        </Reveal>

        <div className="mt-12 space-y-14">
          {VIDEO_CATEGORIES.map((cat) => (
            <div key={cat.id} id={cat.id} className="scroll-mt-24">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h3 className="font-display text-xl font-bold md:text-2xl">{cat.title}</h3>
                  <p className="mt-1 text-sm text-muted">{cat.tagline}</p>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {cat.videos.map((v, i) => (
                  <Reveal key={cat.id + i} delay={(i % 3) * 40}>
                    <VideoCard v={v} />
                  </Reveal>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
