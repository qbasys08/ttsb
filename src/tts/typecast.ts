import { TypecastClient } from "@neosapience/typecast-js";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const TYPECAST_API_KEY = process.env.TYPECAST_API_KEY || "";

const typecast = new TypecastClient({
  apiKey: TYPECAST_API_KEY,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.join(__dirname, "../cache");
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const pendingTTS = new Map<string, Promise<string>>();

export default async function getTypecastAudioPath(text: string): Promise<string> {
  const voiceId = "tc_60db308484130840f23e6ca0";
  const model = "ssfm-v21";

  const hash = crypto.createHash("md5").update(text).digest("hex");
  const filePath = path.join(CACHE_DIR, `${hash}.wav`);

  // 이미 생성 중인 요청이면 기다림
  const existingRequest = pendingTTS.get(hash);
  if (existingRequest) {
    return existingRequest;
  }

  const task = (async () => {
    // 캐시에 있음
    if (await fs.promises
      .access(filePath)
      .then(() => true)
      .catch(() => false)) {

      console.log(`Cache Hit: ${text}`);
      return filePath;
    }

    // 캐시에 없음
    console.log(`Typecast API 호출: ${text}`);

    const audio = await typecast.textToSpeech({
      text,
      model,
      voice_id: voiceId,
    });

    await fs.promises.writeFile(
      filePath,
      Buffer.from(audio.audioData)
    );

    console.log(`캐시 저장 완료: ${hash}`);

    return filePath;
  })();

  pendingTTS.set(hash, task);

  try {
    return await task;
  } finally {
    pendingTTS.delete(hash);
  }
}