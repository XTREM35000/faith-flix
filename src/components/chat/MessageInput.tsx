import React, { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Dynamically import emoji picker to avoid SSR issues (if any)
let Picker: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Picker = require('emoji-picker-react').default;
} catch (e) {
  Picker = null;
}

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (content?: string, attachments?: File[]) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() || files.length > 0) {
        onSend(value.trim(), files);
      }
    }
  };

  const onEmojiClick = (emojiData: any) => {
    const emoji = emojiData?.emoji || emojiData?.unified || '';
    onChange(value + emoji);
    setShowPicker(false);
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files).slice(0, 3 - files.length);
    setFiles(prev => [...prev, ...selected]);
    // Clear input so same file can be chosen again if removed
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
      {showPicker && Picker && (
        <div className="mb-2">
          <Picker onEmojiClick={onEmojiClick} />
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
            className={cn(
              'resize-none',
              'max-h-36',
              'text-sm',
              'rounded-lg'
            )}
            rows={3}
          />

          {/* Selected file previews */}
          {files.length > 0 && (
            <div className="mt-2 flex gap-2">
              {files.map((f, i) => (
                <div key={i} className="relative">
                  {/\.(jpe?g|png|gif|webp)$/i.test(f.name) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={URL.createObjectURL(f)} alt={f.name} className="w-24 h-16 object-cover rounded" />
                  ) : (
                    <div className="w-24 h-16 bg-muted rounded flex items-center justify-center p-2 text-xs">{f.name}</div>
                  )}
                  <button onClick={() => removeFile(i)} className="absolute top-0 right-0 text-destructive">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setShowPicker(s => !s)}
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

      <p className="text-xs text-muted-foreground">Appuyez sur Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne</p>
    </div>
  );
};

export default MessageInput;
