import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { userTTSPreferences } from "../services/stateManager";
import { Command } from "../types";

export const setTTSCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("tts지정")
    .setDescription("본인이 기본으로 사용할 TTS 목소리를 지정합니다.")
    .addStringOption(option => 
      option.setName("목소리")
        .setDescription("원하는 TTS 목소리를 선택하세요.")
        .setRequired(true)
        .addChoices(
          { name: "구글 (한국어, 기본)", value: "google_ko" },
          { name: "구글 (영어)", value: "google_en" },
          { name: "타입캐스트 (잼)", value: "typecast" },
          { name: "엣지 (한국어, 여성)", value: "edge-f" },
          { name: "엣지 (한국어, 남성)", value: "edge-m" }
        )
    ),
  async execute(interaction) {
    const selectedVoice = interaction.options.getString("목소리", true);
    userTTSPreferences.set(interaction.user.id, selectedVoice);

    let voiceName: string;
    switch (selectedVoice) {
      case "google_ko":
        voiceName = "구글 (한국어)";
        break;
      case "google_en":
        voiceName = "구글 (영어)";
        break;
      case "typecast":
        voiceName = "타입캐스트 (잼)";
        break;
      case "edge-f":
        voiceName = "엣지 (한국어, 여성)";
        break;
      case "edge-m":
        voiceName = "엣지 (한국어, 남성)";
        break;
      default:
        voiceName = "알 수 없는 목소리";
    }

    return interaction.reply({ 
      content: `✅ 기본 TTS 목소리가 **${voiceName}**(으)로 설정되었습니다.`, 
      flags: MessageFlags.Ephemeral 
    });
  }
};