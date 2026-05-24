import { useCallback, useEffect, useRef } from "react";

/**
 * Aurra TTS hook — single consistent voice via /api/tts (ElevenLabs).
 *
 * Replaces window.speechSynthesis.speak(). Quiz questions and other repeated phrases
 * are cached in the browser's Cache API so the second viewer pays $0 for them.
 *
 * Usage:
 *   const tts = useAurraTTS();
 *   await tts.speak("Hello"); // plays + caches
 *   tts.cancel();             // stops current playback
 */

const CACHE_NAME = "aurra-tts-v1";
type SpeakStatus = "idle" | "loading" | "speaking";

export function useAurraTTS() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTextRef = useRef<string>("");

  useEffect(() => {
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
    async (text: string, opts: { muted?: boolean; onStart?: () => void; onEnd?: () => void } = {}): Promise<SpeakStatus> => {
      if (!text?.trim()) return "idle";
      if (opts.muted) return "idle";

      cancel();
      lastTextRef.current = text;

      try {
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
          if (!fetched.ok) return "idle";
          response = fetched.clone();
          if (cache) {
            try {
              await cache.put(cacheKey, fetched.clone());
            } catch {
              /* cache.put fails on opaque responses — fine to ignore */
            }
          }
        }

        if (lastTextRef.current !== text) return "idle"; // stale request

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        opts.onStart?.();
        await audio.play();

        return await new Promise<SpeakStatus>((resolve) => {
          audio.onended = () => {
            URL.revokeObjectURL(url);
            opts.onEnd?.();
            resolve("idle");
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            opts.onEnd?.();
            resolve("idle");
          };
        });
      } catch (err) {
        console.warn("[tts] failed:", err);
        return "idle";
      }
    },
    [cancel],
  );

  return { speak, cancel };
}

/** Stable short hash for cache key. */
function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}
