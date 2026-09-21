import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";
import { clearAudioQueue } from "../services/playerManager";
import { Command } from "../types";

export const leaveCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("퇴장")
    .setDescription("봇을 음성 채널에서 내보냅니다."),
  async execute(interaction) {
    const { guildId } = interaction;
    if (!guildId) return;

    const connection = getVoiceConnection(guildId);
    if (!connection) {
      return interaction.reply({ content: "봇이 연결되어 있지 않습니다.", flags: MessageFlags.Ephemeral });
    }

    // 재생 큐 및 플레이어 상태 초기화
    clearAudioQueue();

    // 음성 채널 세션 종료
    connection.destroy();
    return interaction.reply("음성 채널에서 퇴장했습니다.");
  }
};