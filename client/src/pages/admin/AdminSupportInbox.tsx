
import { useEffect, useState } from 'react'
import type { Channel as StreamChannel } from 'stream-chat'
import {
  Chat, Channel, Window, ChannelHeader, MessageList, MessageComposer,
} from 'stream-chat-react'
import { useChat } from '../../context/useChat'

export default function AdminSupportInbox() {
  const { client, connecting } = useChat()
  const [channels, setChannels] = useState<StreamChannel[]>([])
  const [activeChannel, setActiveChannel] = useState<StreamChannel | null>(null)
  const [loadingChannels, setLoadingChannels] = useState(true)

  useEffect(() => {
    if (!client) return

    client
      .queryChannels(
        { type: 'messaging', members: { $in: [client.userID as string] } },
        { last_message_at: -1 }
      )
      .then(setChannels)
      .finally(() => setLoadingChannels(false))
  }, [client])

  if (connecting || !client) {
    return <div className="p-10 text-center font-bold">Connecting to chat…</div>
  }

  return (
    <div className="h-screen flex">
      <div className="w-72 shrink-0 border-r border-zinc-200 bg-white overflow-y-auto">
        <div className="px-4 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">Support Conversations</h2>
        </div>
        {loadingChannels ? (
          <p className="p-4 text-sm text-zinc-400">Loading…</p>
        ) : channels.length === 0 ? (
          <p className="p-4 text-sm text-zinc-400">No conversations yet.</p>
        ) : (
          channels.map(ch => {
            const otherMember = Object.values(ch.state.members).find(
              m => m.user?.id !== client.userID
            )
            const lastMessage = ch.state.messages[ch.state.messages.length - 1]

            return (
              <button
                key={ch.cid}
                onClick={() => setActiveChannel(ch)}
                className={`w-full text-left px-4 py-3 border-b border-zinc-50 hover:bg-zinc-50 transition-colors ${
                  activeChannel?.cid === ch.cid ? 'bg-indigo-50' : ''
                }`}
              >
                <p className="text-sm font-medium text-zinc-900 truncate">
                  {otherMember?.user?.name || 'Customer'}
                </p>
                <p className="text-xs text-zinc-400 truncate mt-0.5">
                  {lastMessage?.text || 'No messages yet'}
                </p>
              </button>
            )
          })
        )}
      </div>

      <div className="flex-1">
        {activeChannel ? (
          <Chat client={client} theme="str-chat__theme-light">
            <Channel channel={activeChannel}>
              <Window>
                <ChannelHeader />
                <MessageList />
                <MessageComposer />
              </Window>
            </Channel>
          </Chat>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-400 text-sm">
            Select a conversation to start replying
          </div>
        )}
      </div>
    </div>
  )
}


