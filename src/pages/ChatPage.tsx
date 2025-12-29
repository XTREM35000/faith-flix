import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/components/ui/notification-system';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender: {
    full_name: string;
    avatar_url?: string;
  };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { notifyError } = useNotification();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const unsub = subscribeToMessages();
    return () => unsub?.();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(full_name, avatar_url)
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      notifyError('Erreur', 'Impossible de charger les messages');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        fetchMessageWithSender(payload.new.id);
      })
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
          sender:profiles(full_name, avatar_url)
        `)
        .eq('id', messageId)
        .single();

      if (error) throw error;
      setMessages(prev => [...prev, data]);
    } catch (err) {
      console.error('Error fetching new message:', err);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{ content: newMessage, sender_id: user.id }]);

      if (error) throw error;
      setNewMessage('');
    } catch (err: any) {
      notifyError('Erreur', "Impossible d'envoyer le message");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Chat de la communauté</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] mb-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start space-x-2 max-w-[70%] ${message.sender_id === user?.id ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <Avatar>
                      <AvatarImage src={message.sender.avatar_url} />
                      <AvatarFallback>{message.sender.full_name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className={`rounded-lg p-3 ${message.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <p className="text-sm font-medium">{message.sender.full_name}</p>
                      <p className="mt-1">{message.content}</p>
                      <p className="text-xs opacity-70 mt-2">{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <form onSubmit={sendMessage} className="flex space-x-2">
            <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Tapez votre message..." className="flex-grow" />
            <Button type="submit" disabled={!newMessage.trim()}>Envoyer</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
