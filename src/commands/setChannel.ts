import { SlashCommandBuilder, ChannelType, PermissionFlagsBits } from "discord.js";
import { guildTTSChannels } from "../services/stateManager";
import { Command } from "../types";

export const setChannelCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("tts채널")
    .setDescription("TTS 메시지를 읽어올 텍스트 채널을 지정하거나 해제합니다. (관리자 전용)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(option =>
      option.setName("채널")
        .setDescription("지정할 텍스트 채널 (비워두면 모든 채널 허용으로 초기화)")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),
  async execute(interaction) {
    const { guildId } = interaction;
    if (!guildId) return;

    const targetChannel = interaction.options.getChannel("채널");

    if (targetChannel) {
      guildTTSChannels.set(guildId, targetChannel.id);
      return interaction.reply({
        content: `📢 앞으로 **${targetChannel.name}** 채널에 올라오는 채팅만 읽어드립니다.`
      });
    } else {
      guildTTSChannels.delete(guildId);
      return interaction.reply({
        content: `📢 TTS 채널 제한이 해제되었습니다. 이제 모든 채널의 채팅을 읽습니다.`
      });
    }
  }
};