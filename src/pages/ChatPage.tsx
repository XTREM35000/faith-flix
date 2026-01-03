import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { useNotification } from '@/components/ui/notification-system';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Heart, ThumbsUp, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  likes_count: number;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { profile } = useUser();
  const { notifyError } = useNotification();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchMessages();
      const unsub = subscribeToMessages();
      return () => unsub?.();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(id, full_name, avatar_url)
        `)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
      setLoading(false);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des messages:', err);
      notifyError('Erreur', 'Impossible de charger les messages');
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          fetchMessageWithSender(payload.new.id);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages(prev =>
            prev.map(msg => msg.id === payload.new.id ? { ...msg, likes_count: payload.new.likes_count } : msg)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchMessageWithSender = async (messageId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(id, full_name, avatar_url)
        `)
        .eq('id', messageId)
        .single();

      if (error) throw error;
      setMessages(prev => [...prev, data]);
    } catch (err) {
      console.error('Erreur lors de la récupération du nouveau message:', err);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{ 
          content: newMessage, 
          sender_id: user.id,
          likes_count: 0
        }]);

      if (error) throw error;
      setNewMessage('');
    } catch (err: any) {
      console.error('Erreur lors de l\'envoi:', err);
      notifyError('Erreur', "Impossible d'envoyer le message");
    }
  };

  const toggleLike = async (messageId: string, currentLikes: number) => {
    if (likedMessages.has(messageId)) {
      const newSet = new Set(likedMessages);
      newSet.delete(messageId);
      setLikedMessages(newSet);
    } else {
      setLikedMessages(new Set(likedMessages).add(messageId));
    }

    try {
      const { error } = await supabase
        .from('messages')
        .update({ likes_count: currentLikes + (likedMessages.has(messageId) ? -1 : 1) })
        .eq('id', messageId);

      if (error) throw error;
    } catch (err) {
      console.error('Erreur lors du like:', err);
      const newSet = new Set(likedMessages);
      likedMessages.has(messageId) ? newSet.add(messageId) : newSet.delete(messageId);
      setLikedMessages(newSet);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Connectez-vous</h2>
          <p className="text-muted-foreground">Vous devez être connecté pour accéder au chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">Chat de la communauté</h1>
          <p className="text-sm text-muted-foreground">Connecté en tant que {profile?.full_name}</p>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 overflow-y-auto">
        <div className="container mx-auto space-y-4 max-w-3xl">
          <AnimatePresence>
            {messages.map((message) => {
              const isOwnMessage = message.sender_id === user?.id;
              const initials = message.sender?.full_name
                ?.split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase() || '?';

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-sm ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={message.sender?.avatar_url} alt={message.sender?.full_name} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>

                    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                      <p className="text-xs text-muted-foreground mb-1 px-3">
                        {message.sender?.full_name}
                      </p>
                      
                      <div
                        className={`rounded-2xl px-4 py-2.5 break-words ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-muted text-foreground rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      {/* Like and React Buttons */}
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => toggleLike(message.id, message.likes_count)}
                          className={`p-1.5 rounded-full transition-all ${
                            likedMessages.has(message.id)
                              ? 'bg-red-500/20 text-red-500'
                              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                          }`}
                          title="J'aime"
                        >
                          <Heart className="w-3.5 h-3.5 fill-current" />
                        </button>
                        {message.likes_count > 0 && (
                          <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full">
                            {message.likes_count} ❤️
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="bg-card border-t border-border p-4 sticky bottom-0">
        <div className="container mx-auto max-w-3xl">
          <form onSubmit={sendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Tapez votre message..."
              className="flex-1"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || loading}
              size="icon"
              className="rounded-full"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
