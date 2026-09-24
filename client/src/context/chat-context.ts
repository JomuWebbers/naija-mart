import { createContext } from 'react'
import type { StreamChat, Channel } from 'stream-chat'

export type ChatContextType = {
  client: StreamChat | null
  channel: Channel | null
  connecting: boolean
  unreadCount: number
  markChatRead: () => void
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined)
