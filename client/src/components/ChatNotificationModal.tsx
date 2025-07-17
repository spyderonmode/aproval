import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, X, Reply } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/hooks/useAuth";

interface ChatMessage {
  id: string;
  fromUserId: string;
  fromUser: string;
  message: string;
  timestamp: string;
}

interface ChatNotificationModalProps {
  message: ChatMessage;
  fromUser: string;
  onReply: (reply: string) => void;
  onClose: () => void;
}

export function ChatNotificationModal({ message, fromUser, onReply, onClose }: ChatNotificationModalProps) {
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const { sendMessage } = useWebSocket();
  const { user } = useAuth();

  // Auto-close after 10 seconds if no interaction
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isReplying) {
        onClose();
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isReplying, onClose]);

  const handleReply = () => {
    if (replyText.trim()) {
      // Send the reply via WebSocket
      sendMessage({
        type: 'send_chat_message',
        toUserId: message.fromUserId,
        message: replyText.trim(),
        fromUser: user?.displayName || user?.firstName || user?.username || 'Player'
      });

      onReply(replyText.trim());
      setReplyText("");
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReply();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-md bg-slate-800 border-slate-700 shadow-2xl animate-in slide-in-from-top-4 duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-lg">New Message</CardTitle>
                <p className="text-sm text-slate-400">From {fromUser}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Message Display */}
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-white">{message.message}</p>
            <p className="text-xs text-slate-400 mt-1">{message.timestamp}</p>
          </div>

          {/* Reply Section */}
          {isReplying ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <Reply className="w-4 h-4" />
                <span>Replying to {fromUser}</span>
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  autoFocus
                />
                <Button
                  onClick={handleReply}
                  disabled={!replyText.trim()}
                  size="sm"
                  className="px-3"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReplying(false)}
                className="w-full text-slate-400"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <Button
                onClick={() => setIsReplying(true)}
                className="flex-1"
                variant="default"
              >
                <Reply className="w-4 h-4 mr-2" />
                Reply
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Dismiss
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}