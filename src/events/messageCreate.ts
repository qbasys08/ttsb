import { Message, GuildMember } from "discord.js";
import { getVoiceConnection, createAudioResource, AudioResource } from "@discordjs/voice";
import { guildTTSChannels, userTTSPreferences } from "../services/stateManager";
import { pushAudioResource } from "../services/playerManager";
import { getTypeCastTTS, getGoogleTTS, getEdgeTTS } from "../tts";

export async function handleMessageCreate(message: Message) {
  if (message.author.bot || message.content.startsWith("/")) return;

  const guildId = message.guild?.id;
  if (!guildId) return;

  const designatedChannelId = guildTTSChannels.get(guildId);
  if (designatedChannelId && message.channel.id !== designatedChannelId) return;

  const connection = getVoiceConnection(guildId);
  if (!connection) return;

  const member = message.member as GuildMember;
  const userVoiceChannelId = member?.voice?.channelId;
  const botVoiceChannelId = connection.joinConfig.channelId;

  if (!userVoiceChannelId || userVoiceChannelId !== botVoiceChannelId) return;

  const text = message.content.trim();
  if (text.length === 0 || text.length > 50) return;

  try {
    let audioResource: AudioResource;

    if (text.startsWith("!잼 ")) {
      audioResource = createAudioResource(await getTypeCastTTS(text.replace("!잼 ", "")));
    } else if (text.startsWith("!영 ")) {
      audioResource = createAudioResource(await getGoogleTTS(text.replace("!영 ", ""), "en"));
    } else if (text.startsWith("!엣지 ")) {
      audioResource = createAudioResource(await getEdgeTTS(text.replace("!엣지 ", ""), "ko-f"));
    } else {
      const userPreference = userTTSPreferences.get(message.author.id) || "google_ko";

      switch (userPreference) {
        case "typecast":
          audioResource = createAudioResource(await getTypeCastTTS(text));
          break;
        case "google_en":
          audioResource = createAudioResource(await getGoogleTTS(text, "en"));
          break;
        case "edge-f":
          audioResource = createAudioResource(await getEdgeTTS(text, "ko-f"));
          break;
        case "edge-m":
          audioResource = createAudioResource(await getEdgeTTS(text, "ko-m"));
          break;
        default:
          audioResource = createAudioResource(await getGoogleTTS(text, "ko"));
      }
    }

    pushAudioResource(audioResource);
  } catch (error) {
    console.error("TTS 처리 중 오류 발생:", error);
  }
}