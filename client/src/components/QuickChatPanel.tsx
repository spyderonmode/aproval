import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface QuickChatPanelProps {
  onMessageClick: (message: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const QUICK_CHAT_MESSAGES = [
  { text: 'Good luck!', category: 'greeting' },
  { text: 'Well played!', category: 'praise' },
  { text: 'Nice move!', category: 'praise' },
  { text: 'Great strategy!', category: 'praise' },
  { text: 'Play faster!', category: 'request' },
  { text: 'Take your time', category: 'encouragement' },
  { text: 'Good game!', category: 'closing' },
  { text: 'Thanks for the game!', category: 'closing' },
  { text: 'One more?', category: 'request' },
  { text: 'Impressive!', category: 'praise' },
  { text: 'Thinking...', category: 'status' },
  { text: 'Ready to play!', category: 'greeting' }
];

export function QuickChatPanel({ onMessageClick, onClose, isOpen }: QuickChatPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-50"
        >
          <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border shadow-lg max-w-xs">
            <CardContent className="p-3">
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {QUICK_CHAT_MESSAGES.map((message, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => onMessageClick(message.text)}
                    className="h-8 text-xs justify-start hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title={`Send: ${message.text}`}
                  >
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="truncate"
                    >
                      {message.text}
                    </motion.span>
                  </Button>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="w-full text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}