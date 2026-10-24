/**
 * Static site copy for Peptides 4 Power.
 * Kept in one place so Dave (or the team) can tweak wording without touching
 * component code.
 */

export const SITE = {
  name: "Peptides 4 Power",
  owner: "David Furka",
  domain: "peptides4power.com",
  tagline: "Peptide education you can actually understand — plus the codes that save you money.",
};

/**
 * Nav links. A plain slug (e.g. "about") is a real page route; a "#id" is a
 * smooth-scroll target on the home page.
 */
export const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Home", href: "#home" },
  { label: "Vendors", href: "#deals" },
  { label: "Videos", href: "#videos" },
  { label: "Peptide of the Week", href: "#featured" },
  { label: "About", href: "about" },
  { label: "Poetry", href: "#poetry" },
  { label: "Contact", href: "#contact" },
];

/** Hero stats strip. */
export const HERO_STATS: { value: string; label: string }[] = [
  { value: "16+", label: "Vetted vendors" },
  { value: "25%", label: "Top discount" },
  { value: "100%", label: "Plain-English" },
];

/**
 * "Peptide of the Week" feature. Editable each week.
 * Mirrors the format Dave ran on the old site (e.g. SLU-PP-332).
 */
export interface BuyOption {
  vendor: string;
  houseBrand?: boolean;
  url: string;
  code: string | null;
  /** Numeric price if known (shows "$X.XX"); otherwise priceNote is shown. */
  price: number | null;
  priceNote?: string | null;
}

export const FEATURED_PEPTIDE = {
  name: "SLU-PP-332",
  nickname: "“Exercise in a bottle”",
  bullets: [
    "Increased metabolic function",
    "Increased fat burning",
    "Premixed, caps, liquid, transdermal & powder options",
  ],
  disclaimer: "For research purposes only. Not medical advice.",
  carriedByNote: "Only two vendors carry it — grab it from either:",
  buyOptions: [
    {
      vendor: "Peptides 4 Power",
      houseBrand: true,
      url: "https://www.peptides4power.us/",
      code: null,
      price: 30.0,
      priceNote: null,
    },
    {
      vendor: "Kimera Chems",
      url: "https://kimerachems.co/product/slu-pp-332/",
      code: "POWER15",
      price: 31.99,
      priceNote: null,
    },
  ] as BuyOption[],
};

/** Peptide Poetry — Dave's signature segment. Placeholder verses until supplied. */
export const POETRY: { title: string; body: string }[] = [
  {
    title: "PEG-MGF / IGF",
    body: `In a lab at AIO, sleek and bright,
Lived PEG-MGF, a peptide of might.
With IGF by its loyal side,
They build up muscle far and wide.
Peg said, "Let's grow, let's heal, let's flex!"
While IGF works through cell specs.
Together they sparked repair and gain,
In fibers torn from heavy strain.
They danced through tissue, swift and clean,
Boosting growth like a well-oiled machine.
Not for fame or gym applause,
Just pure science, without a pause.
So if you hear a whisper low,
Of peptides making muscles grow,
Tip your hat to the AIO pair,
PEG and IGF are beyond compare.`,
  },
  {
    title: "L-Carnitine",
    body: `L-Carnitine at AIO,
Gives your muscles fuel to grow.
Energy high and spirits bright,
It powers the day and trains at night.

Living strong where peptides flow,
Helping every lifter grow.
At AIO it finds its scene...
The mighty friend named L-Carnitine.`,
  },
  {
    title: "Humanin",
    body: `At Alpha Omega, Humanin stays,
Guarding your cells in protective ways.
A peptide of strength, resilience within,
Longevity's ally — that's Humanin.

With energy steady and wellness true,
AlphaOmega brings it straight to you.`,
  },
  {
    title: "Semax",
    body: `At Flawless, Semax stands with pride,
A nootropic boost for the mind inside.
Sharper focus, memory's glow,
A cleaner path where thoughts can flow.

When brainpower's key and clarity too,
Flawless Semax is there for you.`,
  },
  {
    title: "Lipo-C",
    body: `At AIO the choice is clear,
Lipo-C brings the boost your cheer.
Support for health, energy too,
A brighter day is made for you.

Stronger mornings, nights that flow,
With AIO you're good to go.
Wellness shining, can't you see?
Feel the lift with Lipo-C.`,
  },
  {
    title: "Epitalon",
    body: `At AIO, Epitalon shines,
Aging's foe with sleek design.
Stronger cells, a brighter view,
Longevity starts right here with you.

Save big now, it's worth the show,
POWER25 makes prices low.
Take 25% off, the smart way to pay,
Grab Epitalon at AIO today.`,
  },
  {
    title: "HCG",
    body: `HCG can spark the flame,
Hormones balanced, strength reclaimed.
Boosts testosterone, keeps lean mass,
Helps your wellness truly last.

Supports fertility, mood, and drive.
Energy back, you feel alive.
For mind and body, and all it can be,
That's the gift of HCG.`,
  },
  {
    title: "Tesamorelin",
    body: `Tesamorelin's known to trim and define,
Helping reduce belly fat over time.
It boosts growth hormone, supports looking lean,
Improves how your body uses protein.

At AIO and AlphaOmega, it shows,
A peptide for balance, where wellness grows.
With energy lifted and sleep that's more deep,
It helps you recover, restore, and keep.`,
  },
  {
    title: "Double Drop",
    body: `AIO just made a bold new act,
Cartalax and Thymalin join the pack.
Healing and balance now on display,
With Power25 you save today.

Science and savings all in one go,
AIO drops what you need to know.
So stock up now, don't miss the show,
25% off helps the wallet grow.`,
  },
];

/**
 * "About Me" page content — David Furka.
 * DRAFT copy written from what's on the site; Dave should read it over and
 * tweak any wording. Replace `photo` with a real headshot (a Google Drive
 * image id works: "https://lh3.googleusercontent.com/d/<FILE_ID>").
 */
export const ABOUT = {
  name: "David Furka",
  role: "Founder, Peptides 4 Power",
  // About-page photos: one up top (hero), one down at the bottom.
  photoTop: "/about/david-gym.jpg",
  photoBottom: "/about/david-portrait.jpg",
  intro:
    "I'm Dave — the guy behind Peptides 4 Power. I started this site to do one thing: make peptides make sense for regular people, without the hype and without the jargon.",
  paragraphs: [
    "A few years back I was doing my own research, piecing things together from scattered forums, sales pages, and studies that read like they were written to confuse you. I figured if it was that hard for me, it was that hard for everyone. So I started breaking it down the way I wish someone had done for me — plain English, real talk, no fluff. That became \"Dave Dumbs It Down.\"",
    "At 51, I put the work in on myself and documented the whole thing. The results are what keep me doing this: I've seen firsthand what a smart, consistent protocol can do, and I want you to have the same straight-shooting information I had to dig for.",
    "The other half of this site is about saving you money. I only list vendors I actually trust and use, and I've negotiated discount codes with every one of them. When you shop through my links and codes, you get the best price — and it helps support the free education I put out. That's the deal, and I keep it honest.",
  ],
  closing:
    "Everything here is for research and educational purposes only — none of it is medical advice. Watch the videos, use the codes, and reach out if you've got questions. I read them.",
};

/** Contact details. Update with Dave's real handles/email. */
export const CONTACT = {
  blurb:
    "Questions about a protocol, a product, or a discount code? Send a message and Dave's team will get back to you.",
  email: "", // e.g. "dave@peptides4power.com" — leave "" to hide the email line
  socials: [
    // { label: "Instagram", url: "https://instagram.com/..." },
    // { label: "YouTube", url: "https://youtube.com/@..." },
  ] as { label: string; url: string }[],
};
