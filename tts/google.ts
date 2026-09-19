import * as googleTTS from "google-tts-api";

export default async function getGoogleTTSUrl(text: string, lang: string = 'ko', slow: boolean = false): Promise<string> {
  try {
    const url = googleTTS.getAudioUrl(text, { lang, slow });
    return url;
  } catch (error) {
    console.error('Google TTS 처리 중 오류 발생:', error);
    throw error;
  }
}