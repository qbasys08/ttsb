import { 
  ChatInputCommandInteraction, 
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder, 
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder
} from "discord.js";

// name 속성이 반드시 포함된 슬래시 커맨드 데이터 타입
export type SlashCommandData = (
  | SlashCommandBuilder 
  | SlashCommandOptionsOnlyBuilder 
  | SlashCommandSubcommandsOnlyBuilder
  | { toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody }
) & { name: string };

export interface Command {
  data: SlashCommandData;
  execute: (interaction: ChatInputCommandInteraction) => Promise<unknown>;
}