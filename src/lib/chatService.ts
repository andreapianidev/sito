import { supabase } from './supabase';

export interface ChatMessage {
  id: string;
  user_id: string;
  admin_id: string | null;
  message: string;
  sender_type: 'user' | 'admin';
  is_read: boolean;
  created_at: string;
}

export interface ChatConversation {
  user_id: string;
  user_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export const sendMessage = async (
  userId: string,
  message: string,
  senderType: 'user' | 'admin'
) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      user_id: userId,
      message,
      sender_type: senderType,
      is_read: false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getMessages = async (userId: string) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as ChatMessage[];
};

export const markMessagesAsRead = async (userId: string, senderType: 'user' | 'admin') => {
  const { error } = await supabase
    .from('chat_messages')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('sender_type', senderType)
    .eq('is_read', false);

  if (error) throw error;
};

export const getUnreadCount = async (userId: string, forSenderType: 'user' | 'admin') => {
  const { count, error } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('sender_type', forSenderType)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
};

export const subscribeToMessages = (
  userId: string,
  callback: (message: ChatMessage) => void
) => {
  const channel = supabase
    .channel(`chat:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new as ChatMessage);
      }
    )
    .subscribe();

  return channel;
};

export const getAllConversations = async (): Promise<ChatConversation[]> => {
  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      user_profiles!chat_messages_user_id_fkey (
        id,
        full_name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const conversationsMap = new Map<string, ChatConversation>();

  messages?.forEach((msg: any) => {
    const userId = msg.user_id;

    if (!conversationsMap.has(userId)) {
      conversationsMap.set(userId, {
        user_id: userId,
        user_name: msg.user_profiles?.full_name || 'Utente',
        last_message: msg.message,
        last_message_time: msg.created_at,
        unread_count: 0
      });
    }

    if (msg.sender_type === 'user' && !msg.is_read) {
      const conv = conversationsMap.get(userId)!;
      conv.unread_count += 1;
    }
  });

  return Array.from(conversationsMap.values());
};

export const subscribeToAllMessages = (callback: (message: ChatMessage) => void) => {
  const channel = supabase
    .channel('all_chat_messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      },
      (payload) => {
        callback(payload.new as ChatMessage);
      }
    )
    .subscribe();

  return channel;
};
