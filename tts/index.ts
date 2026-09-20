import getTypecastAudioPath from "./typecast";
import getGoogleTTSUrl from "./google";
import getEdgeTTSPath from "./edge";

export async function getGoogleTTS(text: string, lang: string) {
  if (lang === "en") {
    const cleanText = text.replace("!영 ", "").trim();
    return await getGoogleTTSUrl(cleanText, "en", false);
  } else {
    return await getGoogleTTSUrl(text, "ko", false);
  }
}

export async function getTypeCastTTS(text: string) {
  const cleanText = text.replace("!잼 ", "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s?]/gu, "");
  return await getTypecastAudioPath(cleanText);
}

export async function getEdgeTTS(text: string, lang: string) {
  const cleanText = text.replace("!엣지 ", "").trim();
  return await getEdgeTTSPath(cleanText, lang, false);
}