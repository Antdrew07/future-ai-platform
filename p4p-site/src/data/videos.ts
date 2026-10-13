/**
 * Dave's video library — migrated off Wix.
 *
 * Each video references an external host (YouTube or Vimeo) by ID so the
 * Railway site stays light and fast (no video bandwidth on our server).
 * Until Dave's clips are uploaded, leave `videoId` empty ("") and the
 * player renders a labelled placeholder tile instead of an embed.
 *
 * To wire a real video: set provider + videoId.
 *   YouTube  → the part after "v=" or after "youtu.be/"  (e.g. "dQw4w9WgXcQ")
 *   Vimeo    → the numeric id (e.g. "76979871")
 */

export type VideoProvider = "youtube" | "vimeo";

export interface VideoItem {
  title: string;
  /** Host video id. Empty string renders a placeholder until supplied. */
  videoId: string;
  provider: VideoProvider;
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
      { title: "Dave Dumbs It Down — Episode 1", videoId: "", provider: "youtube" },
      { title: "Dave Dumbs It Down — Episode 2", videoId: "", provider: "youtube" },
      { title: "Dave Dumbs It Down — Episode 3", videoId: "", provider: "youtube" },
    ],
  },
  {
    id: "peptide-informational",
    title: "Peptide Informational Videos",
    tagline: "Deeper dives on specific peptides — what they do and how they're used.",
    videos: [
      { title: "Peptide Breakdown — Part 1", videoId: "", provider: "youtube" },
      { title: "Peptide Breakdown — Part 2", videoId: "", provider: "youtube" },
      { title: "Peptide Breakdown — Part 3", videoId: "", provider: "youtube" },
    ],
  },
  {
    id: "informational-continued",
    title: "Informational Videos Continued",
    tagline: "More breakdowns, protocols, and real-world Q&A.",
    videos: [
      { title: "Protocols & Q&A — Part 1", videoId: "", provider: "youtube" },
      { title: "Protocols & Q&A — Part 2", videoId: "", provider: "youtube" },
      { title: "Protocols & Q&A — Part 3", videoId: "", provider: "youtube" },
    ],
  },
];
