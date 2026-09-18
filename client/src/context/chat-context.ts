
import { createContext } from 'react'
import type { StreamChat } from 'stream-chat'

export type ChatContextType = {
  client: StreamChat | null
  connecting: boolean
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined)

