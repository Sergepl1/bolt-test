import { useEffect, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  Message,
  Conversation,
  deleteConversation,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  getConversations,
  subscribeToMessages,
} from '@/lib/messages';
import { useToast } from './use-toast';

export function useMessages(conversationId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let subscription: RealtimeChannel;
    let currentUser: any = null;

    async function fetchMessages() {
      if (!conversationId) return;

      setLoading(true);
      setError(null);
      try {
        // Get current user first
        const { data: { user } } = await supabase.auth.getUser();
        currentUser = user;

        // Fetch messages
        const data = await getMessages(conversationId);
        setMessages(data);
        
        // Check for unread messages
        const unreadMessages = data.filter(msg => !msg.read_at && msg.sender_id !== currentUser?.id);
        if (unreadMessages.length > 0 && currentUser) {
          // Mark messages as read
          const markedCount = await markMessagesAsRead(conversationId);
          if (markedCount > 0) {
            // Update messages to reflect read status
            setMessages(prev => prev.map(msg => 
              !msg.read_at && msg.sender_id !== currentUser.id
                ? { ...msg, read_at: new Date().toISOString() }
                : msg
            ));
          }
        }

        // Subscribe to new messages
        subscription = supabase
          .channel(`messages:${conversationId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${conversationId}`,
            },
            async (payload) => {
              const newMessage = payload.new as Message;
              setMessages((prev) => [...prev, newMessage]);
              
              // Mark new message as read if it's not from current user
              if (newMessage.sender_id !== currentUser?.id) {
                const markedCount = await markMessagesAsRead(conversationId);
                if (markedCount > 0) {
                  // Update the new message to reflect read status
                  newMessage.read_at = new Date().toISOString();
                }
              }
            }
          )
          .subscribe();
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Fehler beim Laden der Nachrichten');
        toast({
          title: 'Fehler beim Laden der Nachrichten',
          description: 'Bitte versuchen Sie es später erneut',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();

    return () => {
      subscription?.unsubscribe();
    };
  }, [conversationId, toast]);

  const send = async (content: string) => {
    if (!conversationId || !content.trim()) return;

    setSending(true);
    setError(null);
    try {
      const newMessage = await sendMessage(conversationId, content);
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Fehler beim Senden der Nachricht');
      toast({
        title: 'Fehler beim Senden der Nachricht',
        description: 'Bitte versuchen Sie es später erneut',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    loading,
    sending,
    error,
    send
  };
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchConversations() {
      setError(null);
      try {
        const data = await getConversations();
        setConversations(data);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setError('Fehler beim Laden der Konversationen');
        toast({
          title: 'Fehler beim Laden der Konversationen',
          description: 'Bitte versuchen Sie es später erneut',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchConversations();

    // Subscribe to new messages to update conversation list
    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  return {
    conversations,
    setConversations,
    deleteConversation: async (id: string) => {
      try {
        await deleteConversation(id);
        setConversations(prev => prev.filter(conv => conv.id !== id));
        toast({
          title: 'Chat gelöscht',
          description: 'Der Chat wurde erfolgreich gelöscht.',
        });
      } catch (error) {
        console.error('Error deleting conversation:', error);
        toast({
          title: 'Fehler beim Löschen',
          description: 'Der Chat konnte nicht gelöscht werden.',
          variant: 'destructive',
        });
      }
    },
    loading,
    error,
  };
}