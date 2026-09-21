import { SlashCommandBuilder, GuildMember, MessageFlags } from "discord.js";
import { joinVoiceChannel } from "@discordjs/voice";
import { player } from "../services/playerManager";
import { Command } from "../types";

export const enterCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("입장")
    .setDescription("봇을 현재 당신이 있는 음성 채널로 부릅니다."),
  async execute(interaction) {
    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel;
    
    if (!voiceChannel) {
      return interaction.reply({ content: "먼저 음성 채널에 입장해주세요.", flags: MessageFlags.Ephemeral });
    }

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    connection.subscribe(player);
    return interaction.reply(`${voiceChannel.name}채널에 연결되었습니다.`);
  }
};