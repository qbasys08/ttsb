import { Client, GatewayIntentBits, REST, Routes, MessageFlags } from "discord.js";
import "dotenv/config";
import { commandsCollection } from "./commands";
import { handleMessageCreate } from "./events/messageCreate";

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

client.login(TOKEN);