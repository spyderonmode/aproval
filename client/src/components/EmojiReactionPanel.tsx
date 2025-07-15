import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmojiReactionPanelProps {
  onReactionClick: (emoji: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const EMOJI_REACTIONS = [
  { emoji: '😂', label: 'Laugh' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '😠', label: 'Angry' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😎', label: 'Cool' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '👍', label: 'Thumbs Up' },
  { emoji: '👎', label: 'Thumbs Down' },
  { emoji: '🤔', label: 'Thinking' },
  { emoji: '🎉', label: 'Party' },
  { emoji: '🎯', label: 'Target' }
];

export function EmojiReactionPanel({ onReactionClick, onClose, isOpen }: EmojiReactionPanelProps) {
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
          <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border shadow-lg">
            <CardContent className="p-3">
              <div className="grid grid-cols-4 gap-2">
                {EMOJI_REACTIONS.map((reaction) => (
                  <Button
                    key={reaction.emoji}
                    variant="ghost"
                    size="sm"
                    onClick={() => onReactionClick(reaction.emoji)}
                    className="h-10 w-10 text-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title={reaction.label}
                  >
                    {reaction.emoji}
                  </Button>
                ))}
              </div>
              <div className="mt-2 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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