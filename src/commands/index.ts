import { Collection } from "discord.js";
import { Command } from "../types";
import { enterCommand } from "./enter";
import { leaveCommand } from "./leave";
import { setTTSCommand } from "./setTTS";
import { setChannelCommand } from "./setChannel";

export const commandsCollection = new Collection<string, Command>();

const commandList: Command[] = [
  enterCommand,
  leaveCommand,
  setTTSCommand,
  setChannelCommand
];

for (const cmd of commandList) {
  commandsCollection.set(cmd.data.name, cmd);
}