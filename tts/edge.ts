import { EdgeTTS } from "node-edge-tts";
import * as path from "path";
import * as os from "os";

/**
 * 언어 코드에 따른 기본 Microsoft Edge 신경망(Neural) 음성 매핑
 */
function getDefaultVoice(lang: string): string {
  if (lang.startsWith('ko-f')) return 'ko-KR-SunHiNeural'; // 한국어 (여성)
  if (lang.startsWith('ko-m')) return 'ko-KR-InJoonNeural'; // 한국어 (남성)
  if (lang.startsWith('en')) return 'en-US-AriaNeural';   // 영어 (여성)
  if (lang.startsWith('ja')) return 'ja-JP-NanamiNeural'; // 일본어 (여성)
  if (lang.startsWith('zh')) return 'zh-CN-XiaoxiaoNeural'; // 중국어 (여성)
  return 'en-US-AriaNeural'; // 기본값
}

export default async function getEdgeTTSPath(
  text: string, 
  lang: string = 'ko-f', 
  slow: boolean = false
): Promise<string> {
  try {
    const voice = getDefaultVoice(lang);
    // slow가 true면 속도를 -20%로 낮춤 (기본값 +0%)
    const rate = slow ? '-20%' : '+0%';

    // EdgeTTS 인스턴스 설정
    const tts = new EdgeTTS({
      voice: voice,
      lang: lang,
      rate: rate,
    });

    // 시스템 임시 폴더에 고유한 파일명으로 MP3 저장 경로 설정
    const filePath = path.join(os.tmpdir(), `edge-tts-${Date.now()}.mp3`);

    // TTS 변환 및 파일 저장 실행
    await tts.ttsPromise(text, filePath);

    return filePath; // 생성된 오디오 파일 경로 반환
  } catch (error) {
    console.error('Edge TTS 처리 중 오류 발생:', error);
    throw error;
  }
}