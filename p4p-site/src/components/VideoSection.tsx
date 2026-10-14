import { VIDEO_CATEGORIES, type VideoItem } from "@/data/videos";

function embedUrl(v: VideoItem): string | null {
  if (!v.videoId) return null;
  if (v.provider === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${v.videoId}`;
  }
  return `https://player.vimeo.com/video/${v.videoId}`;
}

function VideoCard({ v }: { v: VideoItem }) {
  const url = embedUrl(v);
  return (
    <figure className="overflow-hidden rounded-2xl border border-line bg-panel shadow-card">
      <div className="relative aspect-video w-full bg-bg-2">
        {url ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={url}
            title={v.title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-gold/40 bg-gold/10 text-accent">
                <span className="ml-1 text-xl">▶</span>
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
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-eyebrow">Learn from Dave</span>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
            The video library
          </h2>
          <p className="mt-3 text-muted">
            Everything from the original site, reorganized and easier to browse.
          </p>
        </div>

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
                  <VideoCard key={cat.id + i} v={v} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
