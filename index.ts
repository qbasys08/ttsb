// npx tsx index.ts
// npm run dev (수정시 재실행)

import { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  GuildMember,
  ChannelType,
  PermissionFlagsBits
} from "discord.js";
import { 
  joinVoiceChannel, 
  getVoiceConnection,
  createAudioPlayer, 
  createAudioResource,
  AudioPlayerStatus,
  AudioResource
} from "@discordjs/voice";
import "dotenv/config";
import { getTypeCastTTS, getGoogleTTS, getEdgeTTS } from "./tts/index";

const TOKEN = process.env.DISCORD_TOKEN || "";
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const player = createAudioPlayer();

const audioQueue: AudioResource[] = [];
let isPlaying = false;

// 사용자별 TTS 설정을 저장하는 Map (userId -> tts타입)
const userTTSPreferences = new Map<string, string>();

// 서버별 TTS 전용 채널 저장 (guildId -> channelId)
const guildTTSChannels = new Map<string, string>();

function processQueue() {
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

player.on(AudioPlayerStatus.Idle, () => {
  processQueue();
});

player.on("error", (error) => {
  console.error("오디오 재생 중 에러 발생:", error);
  processQueue();
});

// 슬래시 커맨드 정의
const commands = [
  new SlashCommandBuilder()
    .setName("입장")
    .setDescription("봇을 현재 당신이 있는 음성 채널로 부릅니다."),
  new SlashCommandBuilder()
    .setName("퇴장")
    .setDescription("봇을 음성 채널에서 내보냅니다."),
  new SlashCommandBuilder()
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
  new SlashCommandBuilder()
    .setName("tts채널")
    .setDescription("TTS 메시지를 읽어올 텍스트 채널을 지정하거나 해제합니다. (관리자 전용)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(option =>
      option.setName("채널")
        .setDescription("지정할 텍스트 채널 (비워두면 모든 채널 허용으로 초기화)")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
].map(command => command.toJSON());

client.once("clientReady", async () => {
  console.log(`로그인 성공: ${client.user?.tag}`);
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("슬래시 커맨드 등록 완료!");
  } catch (error) {
    console.error("커맨드 등록 실패:", error);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName, guildId } = interaction;
  if (!guildId) return;

  const member = interaction.member as GuildMember;

  if (commandName === "입장") {
    const voiceChannel = member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ content: "먼저 음성 채널에 입장해주세요.", ephemeral: true });
    }

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    connection.subscribe(player);
    return interaction.reply(`${voiceChannel.name}채널에 연결되었습니다.`);
  }

  if (commandName === "퇴장") {
    const connection = getVoiceConnection(guildId);
    if (!connection) {
      return interaction.reply({ content: "봇이 연결되어 있지 않습니다.", ephemeral: true });
    }

    audioQueue.length = 0;
    isPlaying = false;
    player.stop();

    connection.destroy();
    return interaction.reply("음성 채널에서 퇴장했습니다.");
  }

  // TTS지정 명령어 처리
  if (commandName === "tts지정") {
    const selectedVoice = interaction.options.getString("목소리", true);
    userTTSPreferences.set(interaction.user.id, selectedVoice);

    let voiceName: String;
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
      content: `✅ 기본 TTS 목소리가 **${voiceName}**(으)로 설정되었습니다.\n이제 채팅을 치면 해당 목소리로 읽어줍니다.`, 
      ephemeral: true // 본인에게만 보이는 메시지
    });
  }

  if (commandName === "tts채널") {
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
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || message.content.startsWith("/")) return;

  const guildId = message.guild?.id;
  if (!guildId) return;

  const designatedChannelId = guildTTSChannels.get(guildId);
  if (designatedChannelId && message.channel.id !== designatedChannelId) {
    return;
  }

  const connection = getVoiceConnection(guildId);
  if (!connection) return;

  const member = message.member as GuildMember;
  const userVoiceChannelId = member?.voice?.channelId;
  const botVoiceChannelId = connection.joinConfig.channelId;

  if (!userVoiceChannelId || userVoiceChannelId !== botVoiceChannelId) return;

  let text = message.content.trim();
  if (text.length === 0 || text.length > 50) return;

  try {
    let audioResource: AudioResource;

    // 1. 접두사를 사용한 일회성 목소리 덮어쓰기 로직
    if (text.startsWith("!잼 ")) {
      audioResource = createAudioResource(await getTypeCastTTS(text.replace("!잼 ", "")));
    } 
    else if (text.startsWith("!영 ")) {
      audioResource = createAudioResource(await getGoogleTTS(text.replace("!영 ", ""), "en"));
    } 
    else if (text.startsWith("!엣지 ")) {
      audioResource = createAudioResource(await getEdgeTTS(text.replace("!엣지 ", ""), "ko-f"));
    }
    // 2. 접두사가 없다면 유저가 설정한 목소리 사용
    else {
      // 지정한 목소리가 없다면 기본값은 "google_ko"
      const userPreference = userTTSPreferences.get(message.author.id) || "google_ko";

      if (userPreference === "typecast") {
        audioResource = createAudioResource(await getTypeCastTTS(text));
      } else if (userPreference === "google_en") {
        audioResource = createAudioResource(await getGoogleTTS(text, "en"));
      } else if (userPreference === "edge-f") {
        audioResource = createAudioResource(await getEdgeTTS(text, "ko-f"));
      } else if (userPreference === "edge-m") {
        audioResource = createAudioResource(await getEdgeTTS(text, "ko-m"));
      } else {
        audioResource = createAudioResource(await getGoogleTTS(text, "ko"));
      }
    }

    audioQueue.push(audioResource);

    if (!isPlaying) {
      processQueue();
    }

  } catch (error) {
    console.error("TTS 처리 중 오류 발생:", error);
  }
});

client.login(TOKEN);