import { useState, useEffect } from 'react';
import { useRef, useLayoutEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MessageCircle, MessageSquare, Clock, User, ArrowLeft, Search, X, Trash2, Package, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useMessages, useConversations } from '@/hooks/use-messages';
import { markMessagesAsRead } from '@/lib/messages';

export function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { user } = useAuth();
  const messageInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { 
    conversations, 
    setConversations, 
    deleteConversation,
    loading: conversationsLoading 
  } = useConversations();
  const { 
    messages, 
    loading: messagesLoading, 
    sending, 
    send, 
    error: messagesError,
  } = useMessages(
    selectedConversation?.id
  );

  const scrollToBottom = (smooth = true) => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTo({
        top: scrollArea.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  // Use useLayoutEffect to scroll before browser paint
  useLayoutEffect(() => {
    // Instant scroll when conversation changes
    if (selectedConversation) {
      scrollToBottom(false);
    }
  }, [selectedConversation]);

  // Smooth scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(true);
    }
  }, [messages]);

  useEffect(() => {
    if (selectedConversation?.id) {
      // Mark messages as read when conversation is selected
      markMessagesAsRead(selectedConversation.id).then((markedCount) => {
        // Update the unread count in the conversations list
        if (markedCount > 0) {
          setConversations(prevConversations =>
            prevConversations.map(conv =>
              conv.id === selectedConversation.id
                ? { ...conv, unread_count: 0 }
                : conv
            )
          );
        }
      });
    }
  }, [selectedConversation?.id, conversations, setConversations]);

  const filteredConversations = conversations.filter((conv) =>
    (conv.other_user?.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conv.listing?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    
    const trimmedMessage = newMessage.trim();
    await send(newMessage);
    setNewMessage('');
    
    // Focus back on input after sending
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Nachrichten</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="hover:bg-destructive/10"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="grid md:grid-cols-[350px,1fr] divide-x">
            {/* Conversations List */}
            <div className={`${selectedConversation ? 'hidden md:block' : ''}`}>
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Suche nach Nachrichten..."
                    value={searchTerm || ''}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <ScrollArea className="h-[600px]">
                {conversationsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : messagesError ? (
                  <div className="flex items-center justify-center h-full text-destructive">
                    {messagesError}
                  </div>
                ) : filteredConversations.length > 0 ? (
                  <div className="divide-y">
                    {filteredConversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`w-full p-4 text-left hover:bg-secondary/50 transition-colors ${
                          selectedConversation?.id === conversation.id ? 'bg-secondary/50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            {conversation.other_user.avatar_url ? (
                              <img
                                src={conversation.other_user.avatar_url}
                                alt={conversation.other_user.username}
                                className="object-cover"
                              />
                            ) : (
                              <AvatarFallback>
                                {conversation.other_user.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium truncate">
                                {conversation.other_user.username}
                              </p>
                              {conversation.last_message && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <span>
                                    {format(new Date(conversation.last_message.created_at), 'dd. MMM yyyy', {
                                      locale: de,
                                    })}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    {format(new Date(conversation.last_message.created_at), 'HH:mm', {
                                    locale: de,
                                  })}
                                  </span>
                                </p>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.listing?.title || 'Inserat nicht mehr verfügbar'}
                            </p>
                            {conversation.last_message && (
                              <p className="text-sm text-muted-foreground truncate">
                                {conversation.last_message.sender_id === user?.id && 'Sie: '}
                                {conversation.last_message.content}
                              </p>
                            )}
                            {conversation.unread_count > 0 && (
                              <div className="mt-1">
                                <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                                  {conversation.unread_count}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : messages.length > 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <User className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Keine Nachrichten gefunden</p>
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-center">
                    <div className="text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                      <p>Noch keine Nachrichten</p>
                      <p className="text-sm">Schreiben Sie eine Nachricht, um die Konversation zu beginnen.</p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Messages */}
            {selectedConversation ? (
              <div className="flex flex-col h-[600px]">
                {/* Header */}
                <div className="border-b">
                  {/* Listing Info */}
                  {selectedConversation?.listing && (
                    <Link
                      to={`/listings/${selectedConversation.listing.id}`}
                      className="block p-4 hover:bg-secondary/50 transition-colors border-b"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-muted rounded-md overflow-hidden shrink-0">
                          {selectedConversation.listing.listing_images?.[0] ? (
                            <img
                              src={selectedConversation.listing.listing_images[0].url}
                              alt={selectedConversation.listing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-6 h-6 m-3 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">
                            {selectedConversation.listing.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Tag className="h-3 w-3" />
                            <span>
                              {selectedConversation.listing.price?.toLocaleString('de-DE', {
                                style: 'currency',
                                currency: 'CHF',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}
                  {/* User Info */}
                  <div className="p-4 flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Avatar className="h-10 w-10">
                      {selectedConversation.other_user.avatar_url ? (
                        <img
                          src={selectedConversation.other_user.avatar_url}
                          alt={selectedConversation.other_user.username}
                          className="object-cover"
                        />
                      ) : (
                        <AvatarFallback>
                          {selectedConversation.other_user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {selectedConversation.other_user.username}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialogOpen(true)}
                        className="hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div ref={scrollAreaRef} className="flex-1 p-4 overflow-y-auto">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              message.sender_id === user?.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary'
                            }`}
                          >
                            <p className="break-words">{message.content}</p>
                            <p className="text-xs mt-1 opacity-70 flex items-center gap-1">
                              <span>
                                {format(new Date(message.created_at), 'dd. MMM yyyy', {
                                  locale: de,
                                })}
                              </span>
                              <span>•</span>
                              <span>
                                {format(new Date(message.created_at), 'HH:mm', {
                                  locale: de,
                                })}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t">
                  <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                      value={newMessage || ''}
                      ref={messageInputRef}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Schreiben Sie eine Nachricht..."
                      disabled={sending}
                    />
                    <Button type="submit" disabled={!newMessage.trim() || sending}>
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex flex-col items-center justify-center h-[600px] text-center p-4">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine Konversation ausgewählt</h3>
                <p className="text-muted-foreground">
                  Wählen Sie eine Konversation aus der Liste aus, um die Nachrichten anzuzeigen.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Chat löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie diesen Chat wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (selectedConversation) {
                    await deleteConversation(selectedConversation.id);
                    setSelectedConversation(null);
                    setDeleteDialogOpen(false);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}