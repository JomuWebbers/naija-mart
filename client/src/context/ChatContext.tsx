import { useEffect, useState, type ReactNode } from 'react'
import { StreamChat } from 'stream-chat'
import { ChatContext } from './chat-context'
import { useAuth } from './useAuth'
import { apiRequest } from '../lib/api'

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth()
  const [client, setClient] = useState<StreamChat | null>(null)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    if (!user || !token) {
      if (client) {
        client.disconnectUser()
       
      }
      return
    }

  let cancelled = false
   

    apiRequest('/chat/token', { token })
      .then(async data => {
        setConnecting(true)
        const chatClient = StreamChat.getInstance(data.apiKey)
        await chatClient.connectUser({ id: data.userId, name: data.name }, data.token)
        if (!cancelled) setClient(chatClient)
      })
      .catch(err => console.error('Chat connection failed:', err))
      .finally(() => {
        if (!cancelled) setConnecting(false)
      })

    return () => {
      cancelled = true
          if (client) {
      client.disconnectUser();
      setClient(null); // ✅ safe in cleanup
    }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, token])

  return (
    <ChatContext.Provider value={{ client, connecting }}>
      {children}
    </ChatContext.Provider>
  )
}


