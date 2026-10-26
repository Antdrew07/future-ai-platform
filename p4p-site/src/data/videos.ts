/**
 * Dave's video library — migrated off Wix (54 clips, 3 sections).
 *
 * The clips are hosted on Google Drive (folder shared "anyone with the link")
 * and embedded via Drive's preview player. Each entry just carries its Drive
 * file id in `drive`; the player (VideoSection.tsx) builds the embed URL.
 *
 * Other supported ways to point at a clip, if we move a video elsewhere later:
 *   `embed`   → a full iframe URL from any host (Bunny, Cloudflare, Vimeo…)
 *   `file`    → a direct .mp4/.webm URL (native <video> player)
 *   `videoId` + provider "youtube" | "vimeo"
 * Leave all unset to show a "coming soon" tile.
 */

export type VideoProvider = "youtube" | "vimeo";

export interface VideoItem {
  title: string;
  /** Google Drive file id — embedded via Drive's preview player. */
  drive?: string;
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
      { title: "Episode 1: BPC-157", drive: "1qifxqCLEfSeJOhNSrJTN1WxODowsF2VJ" },
      { title: "Episode 2: GHK-Cu", drive: "1V7Z6uTb9qXzux-AzDZ08mVBDWhpeXipK" },
      { title: "Episode 3: TB-500", drive: "1OYCzbFkpKMx8solAUQrQmPAt8Y-LLdbu" },
      { title: "Episode 4: Epitalon", drive: "100sKHZYzqn2YSxpVoiVZU2AR2vApUWkC" },
      { title: "Episode 5: Peptides vs Bioregulators", drive: "1oW-_jl-CN8R08sbqhbMsQCyDPF47Oz1L" },
      { title: "Episode 6: Tesamorelin", drive: "1I_KPO4BdboDAE63l0NpSWCii_4TWIDeb" },
      { title: "Episode 7: Cartalax", drive: "1l4QIenzUoHgFub481CQnOEU6JNDQt-IJ" },
      { title: "Episode 8: 5-Amino-1MQ", drive: "1oGW-d9QXJXnKqiH7L9-7Xh3x2oJBPHNE" },
      { title: "Episode 9: Glow", drive: "1TnXj9SdT_N9QLrWbbCPXHxs0WDnzBvZg" },
      { title: "Episode 10: Peg-MGF", drive: "1Ks-GWaF3rnrFNGv8SyM-f9bj0cCkyX73" },
    ],
  },
  {
    id: "peptide-informational",
    title: "Peptide Informational Videos",
    tagline: "Deeper dives on specific peptides — what they do and how they're used.",
    videos: [
      { title: "Welcome to Peptides4Power", drive: "1h3HrAUX4mf8BE0uD0Vbm0Zz8N_x8AsJ7" },
      { title: "IGF1-LR3", drive: "1JgtZxqUS9ne3ws53knZFvTPqLsCTtn3Z" },
      { title: "What is NAD+?", drive: "1Cr0tCGP98KJEJVNSHkHrhgP0hv5lKT_S" },
      { title: "What is the KLOW blend?", drive: "1GPBLSyn5vs0tsyGEgpJEDEOrFqPIlUuF" },
      { title: "My favorite peptide preworkout", drive: "1HjkbE3dNDEhmvXIlvEyFk6PdqNmuPL0-" },
      { title: "One year peptide transformation — 51 years old", drive: "1ng84gldMoGLymWW9523kTVeaTMC6pOS3" },
      { title: "SLU-PP-332: Exercise in a bottle", drive: "1YqX0Cz6zJaCrtjCd_N3kIgKWd9gTOHkt" },
      { title: "How to maximize NAD+", drive: "1Dc5q3oplEfA-OFSUIX43d-fLMY4IKRwB" },
      { title: "RefillPens — game changer", drive: "1LApXaimhlpmvzQn55rC0Eiez-ZbdFGgf" },
      { title: "What is L-Carnitine?", drive: "1X3CVmn9qFMvcl8TOkmOKFoErPU805oR6" },
      { title: "What is Epitalon?", drive: "1Lha1olOuh32kJgaNNYs2wN_VHFbfW2jR" },
      { title: "Copper Charge Shampoo / Conditioner", drive: "1bgQ87XXdjaSVld-5yHPMmftKAu0UuziK" },
      { title: "Wolverine Blend vs Glow vs Klow", drive: "15BPqi_CIneNO0zNmVicxVT4Q4ROCSNEj" },
      { title: "BPC-157 / TB-500 Eye Drops", drive: "1Uj22CbcFo7lbx3UFesQ4cwkdIap9ENKJ" },
      { title: "Simplify research with RefillPen", drive: "16WI4XzcHj0AKOjifrxSAim7n_ZFasmpd" },
      { title: "AlphaOmegaPeptide — who are they?", drive: "1d0_xtN4TO_1uTJ_lSZd834PRHNw04HG0" },
      { title: "What is Glutathione?", drive: "1k7EHUVCoR7wlUdOHPZjFliCvfk1fSVs8" },
      { title: "What is Semax?", drive: "1XPKpA3eC3seK9GcUTFnvkCxJ1XnntYNq" },
      { title: "How to refill your RefillPen", drive: "1AgcM-SKgiRnRB-WuzzSArYgrRz2vmdl7" },
      { title: "How long will your peptide vial last?", drive: "1tgJP4roBv1w82MMi5cebEAuqx6M5Eo97" },
      { title: "My top peptides for each category", drive: "1M-E4plMvKTgLPfMm51jt-wgjHJqi6iqI" },
      { title: "What is SS-31?", drive: "1pPpMQbhOv4s3_f3IpQCiDpK9zIL13dio" },
    ],
  },
  {
    id: "informational-continued",
    title: "Informational Videos Continued",
    tagline: "More breakdowns, protocols, and real-world Q&A.",
    videos: [
      { title: "What is TB-500?", drive: "1zb3ZLg5iOF9yQ8caGcw1buY31RH5ps2b" },
      { title: "What is Thymalin?", drive: "1HV51-mF2SVFvGDFdY50ZFOsGBkWM9r8Y" },
      { title: "What to do if using GLP-1's", drive: "1qqmXo2NGNR273VPTd9-hhuK9IPRkJZNK" },
      { title: "LL-37 — immunity boost", drive: "10nA1Doq9ulQxldHO8e8FxtKQpsM7hIAD" },
      { title: "GHK-Cu", drive: "1rFSoTGQe4xyESEQX9XZnmzuTe4Lha_3y" },
      { title: "AOD-9604", drive: "16YbL6xcTyHNSEnd_jp1aN-dYdNALNV3t" },
      { title: "KLOW", drive: "1IKWMOLvefsMnGezLTxcpzJOSyX6VrN8H" },
      { title: "Epitalon — fountain of youth", drive: "1Ic4AWZjBb4YUo2IVc5QBpIkh1mDzzHX7" },
      { title: "CJC-1295 / Ipamorelin Blend", drive: "1scuGXYrdsWGVFpUYdw4YwtUBRqOoJEVq" },
      { title: "Melanotan 1 vs 2", drive: "1kCKaOoqyL_J1M608R6y40rgVv694Ad6t" },
      { title: "MOTS-c", drive: "1eRV5HMS94h5SeqH3nvrr7lVVzSMZtqy_" },
      { title: "SS-31 eye drops", drive: "1PstmCe-5j_R3ZgPCwC4K7RqyuO1JYxmq" },
      { title: "Tesamorelin", drive: "1ICxom5-_4nIv_tqMsgmn8uX6-F8Li797" },
      { title: "Thymosin Alpha-1", drive: "1wrPrSPVGlHlAhckQX8Y0b1Mm9gTZCHCF" },
      { title: "Let me coach you", drive: "1-BwwvPHK7TRBe4WVRfCNbhZDgr_EAM1F" },
      { title: "Favorite peptide for each goal", drive: "1uaXiOTAfMi3tFdkHBMAKGabHibSCBOse" },
      { title: "5-Amino-1MQ", drive: "1nfMrB8aHEDDAAhG0UL6r9L74fnLiE8JZ" },
      { title: "How to reconstitute a blend", drive: "1fhm-nsiEP6pwaTymmlyrg0FDIXqUkyrk" },
      { title: "Lyophilized or capsules?", drive: "1Y9PJPOg_t5WueyVzXgrZaD95N6GMRz7c" },
      { title: "What is SNAP-8?", drive: "1V9PwYrFxv2I4SzwRbZkc6e3AWsIMn6gO" },
      { title: "Clomid vs Enclomiphene", drive: "1dsG_4YiKngW2IFOni05_tuaCwvPFegLG" },
      { title: "AHK-Cu vs GHK-Cu", drive: "1dVDlnqHxUcTSKy1Cap6M-kawSQpZwb_b" },
    ],
  },
];
