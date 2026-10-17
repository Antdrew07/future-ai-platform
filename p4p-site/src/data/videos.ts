/**
 * Dave's video library — migrated off Wix (54 clips, 3 sections).
 *
 * HOST-AGNOSTIC: these entries don't care where the video actually lives.
 * The player (VideoSection.tsx) understands four ways to point at a clip —
 * use whichever matches the host you upload to:
 *
 *   1. `embed`   → a full iframe URL from ANY host. This is the catch-all.
 *                  Bunny Stream:     https://iframe.mediadelivery.net/embed/<lib>/<id>
 *                  Cloudflare Stream: https://iframe.videodelivery.net/<id>
 *                  (also works for a Vimeo/YouTube privacy-embed URL)
 *   2. `file`    → a direct .mp4/.webm URL (served from Bunny CDN, R2, S3…).
 *                  Rendered with a native <video> player.
 *   3. `videoId` + provider "youtube" → the id after "v=" / "youtu.be/"
 *   4. `videoId` + provider "vimeo"   → the numeric id
 *
 * Until a clip is uploaded, leave all of the above unset and the player
 * renders a labelled "coming soon" tile. Titles/sections are already live,
 * so each video lights up the moment you paste its link in here.
 */

export type VideoProvider = "youtube" | "vimeo";

export interface VideoItem {
  title: string;
  /** Full iframe src from any host (Bunny, Cloudflare, Vimeo, YouTube…). */
  embed?: string;
  /** Direct video file URL (.mp4/.webm) — rendered with a native player. */
  file?: string;
  /** Host video id, used with `provider` for the YouTube/Vimeo shorthand. */
  videoId?: string;
  provider?: VideoProvider;
  blurb?: string;
}

export interface VideoCategory {
  id: string;
  title: string;
  tagline: string;
  videos: VideoItem[];
}

export const VIDEO_CATEGORIES: VideoCategory[] = [
  {
    id: "dave-dumbs-it-down",
    title: "Dave Dumbs It Down",
    tagline: "The science, in plain English. No jargon, no fluff.",
    videos: [
      { title: "Episode 1: BPC-157" },
      { title: "Episode 2: GHK-Cu" },
      { title: "Episode 3: TB-500" },
      { title: "Episode 4: Epitalon" },
      { title: "Episode 5: Peptides vs Bioregulators" },
      { title: "Episode 6: Tesamorelin" },
      { title: "Episode 7: Cartalax" },
      { title: "Episode 8: 5-Amino-1MQ" },
      { title: "Episode 9: Glow" },
      { title: "Episode 10: Peg-MGF" },
    ],
  },
  {
    id: "peptide-informational",
    title: "Peptide Informational Videos",
    tagline: "Deeper dives on specific peptides — what they do and how they're used.",
    videos: [
      { title: "Welcome to Peptides4Power" },
      { title: "IGF1-LR3" },
      { title: "What is NAD+?" },
      { title: "What is the KLOW blend?" },
      { title: "My favorite peptide preworkout" },
      { title: "One year peptide transformation — 51 years old" },
      { title: "SLU-PP-332: Exercise in a bottle" },
      { title: "How to maximize NAD+" },
      { title: "RefillPens — game changer" },
      { title: "What is L-Carnitine?" },
      { title: "What is Epitalon?" },
      { title: "Copper Charge Shampoo / Conditioner" },
      { title: "Wolverine Blend vs Glow vs Klow" },
      { title: "BPC-157 / TB-500 Eye Drops" },
      { title: "Simplify research with RefillPen" },
      { title: "AlphaOmegaPeptide — who are they?" },
      { title: "What is Glutathione?" },
      { title: "What is Semax?" },
      { title: "How to refill your RefillPen" },
      { title: "How long will your peptide vial last?" },
      { title: "My top peptides for each category" },
      { title: "What is SS-31?" },
    ],
  },
  {
    id: "informational-continued",
    title: "Informational Videos Continued",
    tagline: "More breakdowns, protocols, and real-world Q&A.",
    videos: [
      { title: "What is TB-500?" },
      { title: "What is Thymalin?" },
      { title: "What to do if using GLP-1's" },
      { title: "LL-37 — immunity boost" },
      { title: "GHK-Cu" },
      { title: "AOD-9604" },
      { title: "KLOW" },
      { title: "Epitalon — fountain of youth" },
      { title: "CJC-1295 / Ipamorelin Blend" },
      { title: "Melanotan 1 vs 2" },
      { title: "MOTS-c" },
      { title: "SS-31 eye drops" },
      { title: "Tesamorelin" },
      { title: "Thymosin Alpha-1" },
      { title: "Let me coach you" },
      { title: "Favorite peptide for each goal" },
      { title: "5-Amino-1MQ" },
      { title: "How to reconstitute a blend" },
      { title: "Lyophilized or capsules?" },
      { title: "What is SNAP-8?" },
      { title: "Clomid vs Enclomiphene" },
      { title: "AHK-Cu vs GHK-Cu" },
    ],
  },
];
