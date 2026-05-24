/**
 * ElevenLabs TTS adapter. One voice, one model — consistent voice across the whole app.
 *
 * The client never sees the API key. It POSTs text to /api/tts, we stream MP3 back.
 */

const API = "https://api.elevenlabs.io/v1";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export interface TtsOptions {
  text: string;
  voiceId?: string;
  modelId?: string;
}

/** Returns the MP3 as a Buffer. Use streamSpeech for piping directly to the client. */
export async function synthesize({ text, voiceId, modelId }: TtsOptions): Promise<Buffer> {
  const apiKey = requireEnv("ELEVENLABS_API_KEY");
  const vid = voiceId || requireEnv("ELEVENLABS_VOICE_ID");
  const mid = modelId || process.env.ELEVENLABS_MODEL_ID || "eleven_turbo_v2_5";

  const res = await fetch(`${API}/text-to-speech/${vid}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: mid,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${errBody}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/** Stream the MP3 directly. Lower latency than buffering. Returns the upstream Response so the caller can pipe it. */
export async function streamSpeech({ text, voiceId, modelId }: TtsOptions): Promise<Response> {
  const apiKey = requireEnv("ELEVENLABS_API_KEY");
  const vid = voiceId || requireEnv("ELEVENLABS_VOICE_ID");
  const mid = modelId || process.env.ELEVENLABS_MODEL_ID || "eleven_turbo_v2_5";

  const res = await fetch(`${API}/text-to-speech/${vid}/stream`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: mid,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`ElevenLabs stream ${res.status}: ${errBody}`);
  }

  return res;
}
