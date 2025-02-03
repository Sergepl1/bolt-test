import { supabase } from './supabase';
import type { Tables } from './supabase';

// Add deleteConversation function
export async function deleteConversation(conversationId: string) {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId);

  if (error) throw error;
}

export type Message = Tables['messages']['Row'];
export type Conversation = Tables['conversations']['Row'] & {
  listing: Tables['listings']['Row'];
  other_user: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  last_message?: Message;
  unread_count: number;
};

export async function sendMessage(conversationId: string, content: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.user.id,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markMessagesAsRead(conversationId: string) {
  const { data, error } = await supabase
    .rpc('mark_messages_as_read', {
      conversation_id_param: conversationId,
    });

  if (error) throw error;
  return data;
}


export async function startConversation(listingId: string, sellerId: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  // Check if listing exists and is active
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('status')
    .eq('id', listingId)
    .single();

  if (listingError) throw new Error('Inserat nicht gefunden');
  if (listing.status !== 'active') throw new Error('Inserat ist nicht mehr aktiv');

  // Check if seller exists
  const { data: seller, error: sellerError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', sellerId)
    .single();

  if (sellerError) throw new Error('Verkäufer nicht gefunden');

  // Create or get existing conversation
  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .insert({
      listing_id: listingId,
      participant1_id: user.user.id,
      participant2_id: sellerId,
    })
    .select()
    .single();

  if (conversationError && !conversationError.message.includes('unique_conversation')) {
    throw conversationError;
  }

  // If conversation already exists, get it
  if (conversationError?.message.includes('unique_conversation')) {
    const { data: existing, error: existingError } = await supabase
      .from('conversations')
      .select()
      .eq('listing_id', listingId)
      .eq('participant1_id', user.user.id)
      .eq('participant2_id', sellerId)
      .single();

    if (existingError) throw existingError;
    return existing;
  }

  return conversation;
}

export async function getConversations() {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      listings (
        id, title, status
      )
    `)
    .or(`participant1_id.eq.${user.user.id},participant2_id.eq.${user.user.id}`)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  // Filter out conversations with deleted listings
  const validConversations = data.filter(conv => conv.listings !== null);

  // Get all messages for these conversations
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .in('conversation_id', validConversations.map(c => c.id))
    .order('created_at', { ascending: false });

  // Get all other users' profiles
  const otherUserIds = validConversations.map(conv => 
    conv.participant1_id === user.user.id ? conv.participant2_id : conv.participant1_id
  );

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', otherUserIds);

  return validConversations.map((conv) => {
    const otherUserId = conv.participant1_id === user.user.id 
      ? conv.participant2_id 
      : conv.participant1_id;
    
    const otherUser = profiles?.find(p => p.id === otherUserId) || {
      id: otherUserId,
      username: 'Unknown User',
      avatar_url: null
    };

    const conversationMessages = messages?.filter(m => m.conversation_id === conv.id) || [];
    const lastMessage = conversationMessages[0];
    const unreadCount = conversationMessages.filter(
      m => !m.read_at && m.sender_id !== user.user.id
    ).length;

    return {
      ...conv,
      listing: conv.listings,
      other_user: otherUser,
      last_message: lastMessage,
      unread_count: unreadCount,
    };
  });
}

export async function getMessages(conversationId: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export function subscribeToMessages(
  conversationId: string,
  callback: (message: Message) => void
) {
  return supabase
    .channel('messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new as Message);
      }
    )
    .subscribe();
}