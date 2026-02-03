import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import ErrorBoundary from '@/components/ErrorBoundary';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (content?: string, attachments?: File[]) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const FALLBACK_EMOJIS = [
  '😀','😁','😂','😍','😘','😅','🤣','😊','🙏','🎉','❤️','👍','👎','🙌','😢','😮','😇','😜','🤔','😎'
];

export const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSend,
  isLoading = false,
  disabled = false,
  placeholder = 'Écrivez votre message...',
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [EmojiPicker, setEmojiPicker] = useState<React.ComponentType<Record<string, unknown>> | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!showPicker || EmojiPicker) return;

    import('emoji-picker-react')
      .then((mod) => {
        const modTyped = mod as { default?: React.ComponentType<Record<string, unknown>>; EmojiPicker?: React.ComponentType<Record<string, unknown>> };
        const PickerComponent = modTyped.EmojiPicker || modTyped.default || null;

        if (typeof PickerComponent === 'function') {
          setEmojiPicker(() => PickerComponent);
        } else {
          console.warn('Emoji picker import failed: invalid export', modTyped);
          setEmojiPicker(null);
        }
      })
      .catch((err) => {
        console.error('Emoji picker dynamic import failed:', err);
        setEmojiPicker(null);
      });
  }, [showPicker, EmojiPicker]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() || files.length > 0) {
        onSend(value.trim(), files);
      }
    }
  };

  type EmojiClickArg = { emoji?: string; unified?: string };
  const onEmojiClick = (emojiData: unknown) => {
    const data = (emojiData as EmojiClickArg) || {};
    let emoji = '';

    if (typeof data.emoji === 'string') {
      emoji = data.emoji;
    } else if (typeof data.unified === 'string') {
      emoji = data.unified
        .split('-')
        .map((u: string) => String.fromCodePoint(parseInt(u, 16)))
        .join('');
    }

    if (emoji) {
      onChange(value + emoji);
    }
    setShowPicker(false);
  };

  const handleFallbackSelect = (emoji: string) => {
    onEmojiClick({ emoji });
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files).slice(0, 3 - files.length);
    setFiles(prev => [...prev, ...selected]);
    e.currentTarget.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendClick = () => {
    if (!value.trim() && files.length === 0) return;
    onSend(value.trim(), files);
  };

  return (
    <div className="border-t border-border bg-background p-4 space-y-3">
      {showPicker && (
        <div className="mb-2">
          {EmojiPicker ? (
            <ErrorBoundary fallback={<FallbackEmojiGrid onPick={handleFallbackSelect} />}>
              <EmojiPicker
                onEmojiClick={(ed: unknown) => onEmojiClick(ed)}
                lazyLoadEmojis
                height={350}
              />
            </ErrorBoundary>
          ) : (
            <FallbackEmojiGrid onPick={handleFallbackSelect} />
          )}
        </div>
      )}

      <div className="flex gap-2 items-end">
        <div className="flex flex-col w-full">
          <Textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={cn('resize-none', 'max-h-36', 'text-sm', 'rounded-lg')}
            rows={3}
          />

          {files.length > 0 && (
            <div className="mt-2 flex gap-2">
              {files.map((f, i) => (
                <div key={i} className="relative">
                  {/\.(jpe?g|png|gif|webp)$/i.test(f.name) ? (
                    <img
                      src={URL.createObjectURL(f)}
                      alt={f.name}
                      className="w-24 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-24 h-16 bg-muted rounded flex items-center justify-center p-2 text-xs">
                      {f.name}
                    </div>
                  )}
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-0 right-0 text-destructive"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-1">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowPicker(s => !s);
              }}
              className="h-10 w-10 rounded-md flex items-center justify-center hover:bg-muted/50"
              title="Ajouter un emoji"
            >
              😊
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 w-10 rounded-md flex items-center justify-center hover:bg-muted/50"
              title="Attacher un fichier"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              multiple
              onChange={onPickFiles}
              className="hidden"
            />
          </div>

          <Button
            onClick={handleSendClick}
            disabled={(value.trim() === '' && files.length === 0) || isLoading || disabled}
            size="icon"
            className="flex-shrink-0 h-10 w-10"
            title="Envoyer le message (Entrée)"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Appuyez sur Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne
      </p>
    </div>
  );
};

const FallbackEmojiGrid: React.FC<{ onPick: (emoji: string) => void }> = ({ onPick }) => (
  <div className="p-2 bg-muted rounded">
    <div className="grid grid-cols-6 gap-2 text-lg">
      {FALLBACK_EMOJIS.map((em) => (
        <button
          key={em}
          aria-label={`Emoji ${em}`}
          onMouseDown={(ev) => ev.preventDefault()}
          onClick={() => onPick(em)}
          className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted/50"
          title={em}
        >
          {em}
        </button>
      ))}
    </div>
  </div>
);

export default MessageInput;
