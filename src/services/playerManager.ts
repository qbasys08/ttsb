import { createAudioPlayer, AudioPlayerStatus, AudioResource } from "@discordjs/voice";

export const player = createAudioPlayer();
export const audioQueue: AudioResource[] = [];
let isPlaying = false;

export function processQueue() {
  if (audioQueue.length === 0) {
    isPlaying = false;
    return;
  }

  isPlaying = true;
  const nextResource = audioQueue.shift();
  if (nextResource) {
    player.play(nextResource);
  }
}

export function pushAudioResource(resource: AudioResource) {
  audioQueue.push(resource);
  if (!isPlaying) {
    processQueue();
  }
}

export function clearAudioQueue() {
  audioQueue.length = 0;
  isPlaying = false;
  player.stop();
}

player.on(AudioPlayerStatus.Idle, () => {
  processQueue();
});

player.on("error", (error) => {
  console.error("오디오 재생 중 에러 발생:", error);
  processQueue();
});