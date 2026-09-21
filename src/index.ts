import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  MessageFlags,
  ActivityType,
} from "discord.js";
import {
  getVoiceConnection,
} from "@discordjs/voice";
import "dotenv/config";
import { commandsCollection } from "./commands";
import { handleMessageCreate } from "./events/messageCreate";
import { clearAudioQueue } from "./services/playerManager";
import { getTTSChannelId } from "./commands/setChannel";

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

// READY 이벤트: 커맨드 자동 등록
client.once("clientReady", async () => {
  console.log(`로그인 성공: ${client.user?.tag}`);
  client.user?.setActivity("저희봇 정상영업 합니다.", {
    type: ActivityType.Listening
  });

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  try {
    const payload = Array.from(commandsCollection.values()).map((cmd) => cmd.data.toJSON());
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: payload });
    console.log("슬래시 커맨드 등록 완료!");
  } catch (error) {
    console.error("커맨드 등록 실패:", error);
  }
});

// INTERACTION 이벤트: 커맨드 분기 실행
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commandsCollection.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`명령어 실행 오류 [${interaction.commandName}]:`, error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "명령어 실행 중 오류가 발생했습니다.", flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ content: "명령어 실행 중 오류가 발생했습니다.", flags: MessageFlags.Ephemeral });
    }
  }
});

// MESSAGE 이벤트: TTS 실행
client.on("messageCreate", handleMessageCreate);

// 음성 채널 자동 퇴장
// 봇이 들어가 있는 채널에서 사람이 전부 나가면 자동으로 퇴장하고
// /tts채널로 지정된 텍스트 채널에 안내 메시지를 보냅니다.
client.on("voiceStateUpdate", async (oldState) => {
  if (!oldState.channelId) return;

  const guildId = oldState.guild.id;
  const connection = getVoiceConnection(guildId);
  if (!connection) return;

  const botChannelId = connection.joinConfig.channelId;
  if (!botChannelId || oldState.channelId !== botChannelId) return;

  const voiceChannel = oldState.channel;
  if (!voiceChannel) return;

  // 봇 계정은 제외하고 사람만 확인
  const humanMembers = voiceChannel.members.filter(
    (member) => !member.user.bot
  );

  if (humanMembers.size > 0) return;

  console.log(
    `[자동 퇴장] ${voiceChannel.name} 채널에 사람이 없어 봇이 자동으로 퇴장합니다.`
  );

  // TTS 재생 큐 초기화
  clearAudioQueue();

  // /tts채널로 지정된 채널에 자동 퇴장 공지
  const ttsChannelId = getTTSChannelId(guildId);

  if (ttsChannelId) {
    try {
      const channel = await client.channels.fetch(ttsChannelId);

      // isSendable()을 사용해 send() 가능한 채널인지 확인
      if (channel && channel.isSendable()) {
        await channel.send(
          "📢 파업합니다."
        );

        console.log(
          `[자동 퇴장 공지] ${ttsChannelId} 채널에 공지를 보냈습니다.`
        );
      }
    } catch (error) {
      console.error(
        `[자동 퇴장 공지 실패] 채널 ID: ${ttsChannelId}`,
        error
      );
    }
  } else {
    console.log("[자동 퇴장] 지정된 TTS 채널이 없습니다.");
  }

  // 음성 채널에서 퇴장
  connection.destroy();
});

client.login(TOKEN);
