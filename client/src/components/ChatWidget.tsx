import { useEffect, useState } from "react";
import type { Channel as StreamChannel } from "stream-chat";
import {
  Chat,
  Channel,
  Window,
  ChannelHeader,
  MessageList,
  MessageComposer,
} from "stream-chat-react";

import { MessageCircleIcon, XIcon } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { useChat } from "../context/useChat";
import { apiRequest } from "../lib/api";

export default function ChatWidget() {
  const { user, token } = useAuth();
  const { client, connecting } = useChat();
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<StreamChannel | null>(null);

  
  useEffect(() => {
    if (!open || !client || !user || channel) return;

    apiRequest("/chat/support-agent", { token: token ?? undefined })
      .then(async ({ agentId }) => {
        const streamUserId = `naijamart_${user.id}`;
        const ch = client.channel("messaging", `support-${user.id}`, {
          members: [streamUserId, agentId],
        });
        await ch.watch();
        setChannel(ch);
      })
      .catch((err) => console.error("Failed to open support chat:", err));
   
  }, [open, client, user, token, channel]);

  // Don't show the widget for logged-out visitors or for the admin
  // (the admin uses a dedicated inbox page instead, built next)
  if (!user || user.role === "admin") return null;

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-40 size-14 rounded-full bg-black text-white flex items-center justify-center shadow-lg hover:bg-neutral-800 transition-colors"
        aria-label="Open help center chat"
      >
        {open ? (
          <XIcon className="size-6" />
        ) : (
          <MessageCircleIcon className="size-6" />
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-40 w-[90vw] max-w-sm h-[70vh] max-h-[520px] border-2 border-black bg-white shadow-xl flex flex-col overflow-hidden">
          {connecting || !client || !channel ? (
            <div className="flex-1 flex items-center justify-center text-sm text-neutral-400">
              Connecting to support…
            </div>
          ) : (
            <Chat client={client} theme="str-chat__theme-light">
              <Channel channel={channel}>
                <Window>
                  <ChannelHeader title="Naija Mart Support" />
                  <MessageList />
                  <MessageComposer />
                </Window>
              </Channel>
            </Chat>
          )}
        </div>
      )}
    </>
  );
}


