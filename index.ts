import { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  GuildMember 
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
import { getTypeCastTTS, getGoogleTTS, getEdgeTTS } from "./tts";

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

const commands = [
  new SlashCommandBuilder()
    .setName("입장")
    .setDescription("봇을 현재 당신이 있는 음성 채널로 부릅니다."),
  new SlashCommandBuilder()
    .setName("퇴장")
    .setDescription("봇을 음성 채널에서 내보냅니다."),
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
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || message.content.startsWith("/")) return;

  const guildId = message.guild?.id;
  if (!guildId) return;

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

    if (text.startsWith("!잼 ")) {
      audioResource = createAudioResource(await getTypeCastTTS(text));
    } 
    else if (text.startsWith("!영 ")) {
      audioResource = createAudioResource(await getGoogleTTS(text, "en"));
    } 
    else if (text.startsWith("!엣지 ")) {
      audioResource = createAudioResource(await getEdgeTTS(text, "ko"));
    }
    else {
      audioResource = createAudioResource(await getGoogleTTS(text, "ko"));
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