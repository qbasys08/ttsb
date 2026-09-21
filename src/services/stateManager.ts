// 사용자별 TTS 설정 (userId -> voiceType)
export const userTTSPreferences = new Map<string, string>();

// 서버별 TTS 전용 채널 (guildId -> channelId)
export const guildTTSChannels = new Map<string, string>();