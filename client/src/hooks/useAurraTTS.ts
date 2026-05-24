import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Aurra TTS hook — consistent voice via pre-generated static MP3s + /api/tts fallback.
 *
 * Priority:
 *  1. Static manifest lookup (free, instant, no API call) — covers all fixed phrases
 *     listed in scripts/generate-voice.ts. Re-generate with:
 *       npx tsx scripts/generate-voice.ts
 *  2. /api/tts fallback for dynamic phrases (NOVA chat replies, etc.)
 *  3. Browser Cache API caches /api/tts results so dynamic phrases are free on repeat
 */

const CACHE_NAME = "aurra-tts-v2";
type SpeakStatus = "idle" | "loading" | "speaking";
type Manifest = Record<string, string>;

let manifestPromise: Promise<Manifest> | null = null;

function loadManifest(): Promise<Manifest> {
  if (!manifestPromise) {
    manifestPromise = fetch("/voice/manifest.json")
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return manifestPromise;
}

export function useAurraTTS() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTextRef = useRef<string>("");
  const [manifest, setManifest] = useState<Manifest>({});

  useEffect(() => {
    loadManifest().then(setManifest);
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const cancel = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const speak = useCallback(
    async (
      text: string,
      opts: { muted?: boolean; onStart?: () => void; onEnd?: () => void } = {},
    ): Promise<SpeakStatus> => {
      if (!text?.trim()) return "idle";
      if (opts.muted) return "idle";

      cancel();
      lastTextRef.current = text;

      try {
        let audioUrl: string | null = null;

        // 1. Static manifest — covers all pre-generated fixed phrases
        const m = manifest[text] || (await loadManifest())[text];
        if (m) {
          audioUrl = m;
        } else {
          // 2. /api/tts fallback for dynamic phrases (NOVA chat replies)
          const cacheKey = `/api/tts?h=${hash(text)}`;
          const cache = "caches" in window ? await caches.open(CACHE_NAME).catch(() => null) : null;
          let response: Response | null = null;

          if (cache) {
            const hit = await cache.match(cacheKey);
            if (hit) response = hit;
          }

          if (!response) {
            const fetched = await fetch("/api/tts", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text }),
            });
            if (!fetched.ok) {
              console.warn("[tts] dynamic fallback failed:", fetched.status);
              return "idle";
            }
            response = fetched.clone();
            if (cache) {
              try {
                await cache.put(cacheKey, fetched.clone());
              } catch {
                /* opaque response, ignore */
              }
            }
          }

          if (lastTextRef.current !== text) return "idle"; // stale
          const blob = await response.blob();
          audioUrl = URL.createObjectURL(blob);
        }

        if (lastTextRef.current !== text) return "idle";

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        opts.onStart?.();
        try {
          await audio.play();
        } catch (playErr) {
          // Browser autoplay block — needs a prior user gesture. Silent failure is fine.
          console.warn("[tts] audio.play() blocked (autoplay policy)", playErr);
          opts.onEnd?.();
          return "idle";
        }

        return await new Promise<SpeakStatus>((resolve) => {
          audio.onended = () => {
            if (audioUrl?.startsWith("blob:")) URL.revokeObjectURL(audioUrl);
            opts.onEnd?.();
            resolve("idle");
          };
          audio.onerror = () => {
            if (audioUrl?.startsWith("blob:")) URL.revokeObjectURL(audioUrl);
            opts.onEnd?.();
            resolve("idle");
          };
        });
      } catch (err) {
        console.warn("[tts] failed:", err);
        return "idle";
      }
    },
    [cancel, manifest],
  );

  return { speak, cancel };
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}
