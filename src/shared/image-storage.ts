import { supabase, SUPABASE_URL } from './supabase-client';

// Images uploaded from the Overview editor live in a PRIVATE Supabase Storage bucket.
// The saved overview HTML stores stable canonical paths ("overview-images/<uuid>.png").
// Signed URLs (1h expiry) are generated for display only and never persisted.

export const BUCKET = 'overview-images';
export const DESIGN_BUCKET = 'order-designs';

type SignedEntry = { url: string; expiresAt: number };
const signedCache = new Map<string, SignedEntry>();

/** Upload a File and return its canonical storage path (e.g. "overview-images/x.png"). */
export async function uploadImage(file: File): Promise<string | null> {
  if (!supabase) return null;
  const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'png';
  // storage paths are bucket-relative; the bucket prefix is a marker in our canonical HTML form
  const name = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(name, file, { contentType: file.type });
  if (error) {
    console.error('Image upload failed', error);
    return null;
  }
  return `${BUCKET}/${name}`;
}

/** Swap canonical "overview-images/…" img srcs for short-lived signed URLs (cached until near-expiry). */
export async function resolveStorageImages(html: string): Promise<string> {
  if (!supabase) return html;
  const sb = supabase;
  const paths = [...html.matchAll(/src="(overview-images\/[^"]+)"/g)].map((m) => m[1]);
  if (paths.length === 0) return html;
  const resolved = await Promise.all(
    [...new Set(paths)].map(async (path) => {
      let entry = signedCache.get(path);
      if (!entry || entry.expiresAt < Date.now() + 5 * 60_000) {
        // sign the bucket-relative name (strip our canonical bucket marker)
        const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path.replace(/^overview-images\//, ''), 60 * 60);
        if (error || !data) {
          console.error('Signing failed for', path, error);
          return null;
        }
        entry = { url: data.signedUrl, expiresAt: Date.now() + 60 * 60_000 };
        signedCache.set(path, entry);
      }
      return { path, url: entry.url };
    }),
  );
  let out = html;
  for (const r of resolved) {
    if (r) out = out.split(`src="${r.path}"`).join(`src="${r.url}"`);
  }
  return out;
}

/** Upload a design file to the private order-designs bucket. */
export async function uploadDesignFile(file: File): Promise<string | null> {
  if (!supabase) return null;
  const ext = file.name.split('.').pop()?.toLowerCase()?.slice(0, 8) || file.type.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
  const name = `${crypto.randomUUID()}.${ext.replace(/[^a-z0-9]/g, '') || 'png'}`;
  const { error } = await supabase.storage.from(DESIGN_BUCKET).upload(name, file, { contentType: file.type || 'application/octet-stream' });
  if (error) {
    console.error('Design upload failed', error);
    return null;
  }
  return `${DESIGN_BUCKET}/${name}`;
}

const designSignedCache = new Map<string, SignedEntry>();

export async function resolveDesignUrls(paths: string[]): Promise<Record<string, string>> {
  if (!supabase || paths.length === 0) return {};
  const out: Record<string, string> = {};
  await Promise.all([...new Set(paths)].map(async (path) => {
    if (!path.startsWith(DESIGN_BUCKET + '/')) { out[path] = path; return; }
    let entry = designSignedCache.get(path);
    if (!entry || entry.expiresAt < Date.now() + 5 * 60_000) {
      const { data, error } = await supabase!.storage.from(DESIGN_BUCKET).createSignedUrl(path.replace(`${DESIGN_BUCKET}/`, ''), 60 * 60);
      if (error || !data) { console.error('Design signing failed', path, error); out[path] = path; return; }
      entry = { url: data.signedUrl, expiresAt: Date.now() + 60 * 60_000 };
      designSignedCache.set(path, entry);
    }
    out[path] = entry.url;
  }));
  return out;
}

/** Swap signed storage URLs back to canonical paths before persisting, so expirable URLs never reach the DB. */
export function canonicalizeStorageImages(html: string): string {
  if (!SUPABASE_URL) return html;
  const signPrefix = `${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/`;
  return html.replace(
    /src="([^"]*\/storage\/v1\/object\/sign\/overview-images\/[^"]+)"/g,
    (_match, url: string) => {
      const after = url.slice(url.indexOf(signPrefix) + signPrefix.length);
      const path = after.split('?')[0];
      return `src="${BUCKET}/${path}"`;
    },
  );
}
