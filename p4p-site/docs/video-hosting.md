# Self-hosting Dave's videos on Cloudflare R2

Our own video CDN, on our own domain, for roughly **10 cents a month**.
R2 charges for storage (~$0.015/GB) but **$0 for bandwidth/egress** — that's the
whole reason we use it instead of serving video from Railway.

The site player (`src/components/VideoSection.tsx`) already supports direct video
files via the `file` field in `src/data/videos.ts`. Once the clips are uploaded,
we just paste the URLs in — no code changes.

There are 3 one-time steps: **transcode → create bucket → upload**. Everything
below runs on your Mac (the files live there; the cloud box can't reach them).

---

## Step 1 — Transcode the .mov files to web MP4

Browsers won't reliably play Apple `.mov`, so every clip becomes an H.264 MP4.
This is a one-time batch. Install ffmpeg, then run the loop.

```bash
# install ffmpeg (once)
brew install ffmpeg

# go to wherever the 54 downloads landed (usually ~/Downloads)
cd ~/Downloads

# output folder for the web-ready files
mkdir -p ~/p4p-mp4

# convert every .mov -> .mp4, web-optimized, URL-safe filename
for f in *.mov *.MOV *.mp4 *.MP4; do
  [ -e "$f" ] || continue
  base="${f%.*}"
  # slugify: lowercase, spaces/punct -> hyphens
  slug=$(echo "$base" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')
  out="$HOME/p4p-mp4/${slug}.mp4"
  echo "→ $f  ->  ${slug}.mp4"
  ffmpeg -nostdin -i "$f" \
    -c:v libx264 -preset slow -crf 23 \
    -vf "scale='min(1920,iw)':-2" \
    -c:a aac -b:a 128k \
    -movflags +faststart \
    -y "$out"
done

echo "Done. Converted files are in ~/p4p-mp4"
ls -lh ~/p4p-mp4
```

Notes:
- `-movflags +faststart` lets playback start before the file fully downloads
  (essential for streaming).
- `-crf 23` is a good quality/size balance; lower = higher quality + bigger.
- The slug step gives clean URLs like `episode-1-bpc-157.mp4` (no spaces to encode).

---

## Step 2 — Create the R2 bucket

1. Sign in / sign up at <https://dash.cloudflare.com> (free account).
2. Left sidebar → **R2** → **Create bucket**.
3. Name it `p4p-videos`. Location: Automatic. Create.
   - Free tier covers 10 GB storage; our ~7 GB fits.

### Get an API token for uploading
1. R2 → **Manage R2 API Tokens** → **Create API Token**.
2. Permissions: **Object Read & Write**, scoped to the `p4p-videos` bucket.
3. Save the three values it shows — you'll need them in Step 3:
   - **Access Key ID**
   - **Secret Access Key**
   - **Account ID** (also shown on the R2 overview page; your S3 endpoint is
     `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`)

> Keep the Secret Access Key private — don't paste it into this chat or commit it.

---

## Step 3 — Upload the MP4s

Using the AWS CLI (R2 speaks the S3 protocol). `rclone` works too, but this is
the fewest steps.

```bash
brew install awscli

# configure a profile with the R2 token from Step 2
aws configure --profile r2
#   AWS Access Key ID     -> <Access Key ID>
#   AWS Secret Access Key -> <Secret Access Key>
#   Default region name   -> auto
#   Default output format -> (leave blank)

# upload everything (replace <ACCOUNT_ID>)
aws s3 cp ~/p4p-mp4 s3://p4p-videos/ \
  --recursive \
  --content-type video/mp4 \
  --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com \
  --profile r2
```

---

## Step 4 — Make them publicly reachable (pick one)

### Option A — instant, test now (ugly URL)
R2 bucket → **Settings** → **Public access** → enable **r2.dev subdomain**.
Your files are then at:
```
https://pub-XXXXXXXX.r2.dev/episode-1-bpc-157.mp4
```
Good enough to go live today. Cloudflare rate-limits r2.dev, so it's meant for
testing/low traffic — fine to start, upgrade to Option B when ready.

### Option B — proper: video.peptides4power.com (do this eventually)
R2 bucket → **Settings** → **Custom Domains** → **Connect Domain** →
`video.peptides4power.com`. This requires the `peptides4power.com` zone to be on
Cloudflare DNS.

⚠️ **Don't just flip nameservers** — the domain currently runs the live Wix site
and email through GoDaddy. Moving DNS to Cloudflare means re-creating every
existing record (Wix site records + MX email records) first, or the live site
and Dave's email break. We're going to move DNS to Cloudflare anyway for the
Railway cutover, so we'll do it carefully as one planned step. Tell me when you
want to tackle that and I'll give you the exact record list to copy first.

Files are then at:
```
https://video.peptides4power.com/episode-1-bpc-157.mp4
```

---

## Step 5 — Hand off to me

Once uploaded, send me **two things** and I wire all 54 in one deploy:

```bash
# 1. the base URL (r2.dev or the custom domain)
# 2. the exact list of filenames:
ls ~/p4p-mp4
```

Because the filenames carry the titles, I can match each clip to its slot
automatically. You don't have to do them all at once — any batch works; the rest
stay "coming soon" until you upload them.
