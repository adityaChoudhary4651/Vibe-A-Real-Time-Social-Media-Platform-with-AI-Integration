import { motion, AnimatePresence } from "framer-motion";

const emojis = [
  "😀", "😂", "🥹", "😍", "🥰", "😘", "😎", "🤩",
  "😊", "🙂", "😉", "😋", "🤪", "😜", "🤗", "🤔",
  "😴", "🥳", "😇", "🥺", "😢", "😭", "😤", "😡",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
  "👍", "👎", "👏", "🙌", "🤝", "💪", "✨", "🔥",
  "🎉", "🎊", "💯", "⭐", "🌟", "💫", "🌈", "☀️",
];

interface EmojiPickerProps {
  open: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ open, onSelect, onClose }: EmojiPickerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-0 mb-2 p-3 bg-card border border-border rounded-2xl shadow-lg z-50 w-72"
          >
            <div className="grid grid-cols-8 gap-1">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onSelect(emoji);
                    onClose();
                  }}
                  className="h-8 w-8 flex items-center justify-center text-lg hover:bg-secondary rounded-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}