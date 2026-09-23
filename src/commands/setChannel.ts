import {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";
import * as fs from "fs";
import * as path from "path";
import { Command } from "../types";

// =====================================================
// TTS 채널 설정
// setChannel.ts에서 지정/저장/불러오기를 모두 담당합니다.
// =====================================================

const DATA_DIR = path.join(process.cwd(), "data");
const TTS_CHANNEL_FILE = path.join(DATA_DIR, "guildTTSChannels.json");

// 서버 ID -> TTS 채널 ID
const guildTTSChannels = new Map<string, string>();

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadTTSChannels() {
  try {
    ensureDataDirectory();

    if (!fs.existsSync(TTS_CHANNEL_FILE)) {
      fs.writeFileSync(TTS_CHANNEL_FILE, "{}", "utf8");
      return;
    }

    const raw = fs.readFileSync(TTS_CHANNEL_FILE, "utf8").trim();
    if (!raw) return;

    const saved = JSON.parse(raw) as Record<string, string>;

    guildTTSChannels.clear();

    for (const [guildId, channelId] of Object.entries(saved)) {
      if (typeof guildId === "string" && typeof channelId === "string") {
        guildTTSChannels.set(guildId, channelId);
      }
    }

    console.log(
      `[TTS 채널] 저장된 설정 ${guildTTSChannels.size}개를 불러왔습니다.`
    );
  } catch (error) {
    console.error("[TTS 채널] 설정 불러오기 실패:", error);
  }
}

function saveTTSChannels() {
  try {
    ensureDataDirectory();

    const data = Object.fromEntries(guildTTSChannels);
    const tempFile = `${TTS_CHANNEL_FILE}.tmp`;

    fs.writeFileSync(
      tempFile,
      JSON.stringify(data, null, 2),
      "utf8"
    );

    fs.renameSync(tempFile, TTS_CHANNEL_FILE);
  } catch (error) {
    console.error("[TTS 채널] 설정 저장 실패:", error);
  }
}

// 다른 파일에서는 이 함수로 현재 지정된 TTS 채널을 가져옵니다.
export function getTTSChannelId(guildId: string): string | undefined {
  return guildTTSChannels.get(guildId);
}

// 봇 시작 시 저장된 설정을 자동으로 불러옵니다.
loadTTSChannels();

export const setChannelCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("tts채널")
    .setDescription(
      "TTS 메시지를 읽어올 텍스트 채널을 지정하거나 해제합니다. (관리자 전용)"
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((option) =>
      option
        .setName("채널")
        .setDescription(
          "지정할 텍스트 채널 (비워두면 모든 채널 허용으로 초기화)"
        )
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

  async execute(interaction) {
    const { guildId } = interaction;
    if (!guildId) return;

    const targetChannel = interaction.options.getChannel("채널");

    if (targetChannel) {
      guildTTSChannels.set(guildId, targetChannel.id);
      saveTTSChannels();

      return interaction.reply({
        content:
          `📢 앞으로 **${targetChannel.name}** 채널에 올라오는 채팅만 읽어드립니다.\n`
      });
    }

    guildTTSChannels.delete(guildId);
    saveTTSChannels();

    return interaction.reply({
      content:
        "📢 TTS 채널 제한이 해제되었습니다. 이제 모든 채널의 채팅을 읽습니다.\n"
    });
  },
};
