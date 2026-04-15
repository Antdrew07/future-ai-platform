import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Send, Bot, User, Zap, Loader2 } from "lucide-react";
import { nanoid } from "nanoid";
import { Streamdown } from "streamdown";

interface Props {
  agentId: number;
  isPublic?: boolean;
}

export default function AgentChatPanel({ agentId, isPublic = false }: Props) {
  const [sessionId] = useState(() => nanoid(16));
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: history, refetch } = trpc.chat.history.useQuery(
    { agentId, sessionId },
    { enabled: !isPublic }
  );

  const sendMutation = trpc.chat.send.useMutation({
    onSuccess: () => { refetch(); setInput(""); },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, sendMutation.isPending]);

  const handleSend = () => {
    if (!input.trim() || sendMutation.isPending) return;
    sendMutation.mutate({ agentId, sessionId, message: input });
  };

  const messages = history ?? [];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && !sendMutation.isPending && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Bot className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Test your agent</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Send a message to see how your agent responds. Changes to the system prompt take effect immediately.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-xl px-4 py-3 text-sm ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border/50"
            }`}>
              {msg.role === "assistant" ? (
                <Streamdown>{msg.content}</Streamdown>
              ) : (
                <p>{msg.content}</p>
              )}
              {msg.role === "assistant" && msg.creditsUsed > 0 && (
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground border-t border-border/30 pt-2">
                  <Zap className="w-3 h-3" />
                  {msg.creditsUsed.toFixed(1)} credits
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {sendMutation.isPending && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-card border border-border/50 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Thinking...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/50">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Message your agent..."
            className="bg-input/50"
            disabled={sendMutation.isPending}
          />
          <Button onClick={handleSend} disabled={!input.trim() || sendMutation.isPending} size="icon" className="flex-shrink-0">
            {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
