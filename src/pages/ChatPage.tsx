import { ChatWindow } from '../components/chat/ChatWindow'
import { UserList } from '../components/chat/UserList'
import { Navbar } from '../components/layout/Navbar'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'

export const ChatPage = () => {
  const { user } = useAuth()
  const {
    users,
    usersLoading,
    usersError,
    activeUser,
    messages,
    messagesLoading,
    messagesError,
    unreadCounts,
    isConnected,
    connectionError,
    isSending,
    selectUser,
    sendMessage,
    refreshUsers,
  } = useChat()

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar />
      <main className="flex min-h-0 flex-1 px-3 py-3 sm:px-5 sm:py-5">
        <div className="flex min-h-0 flex-1 overflow-hidden rounded-[32px] border border-white/70 bg-white/75 shadow-panel backdrop-blur">
          <UserList
            users={users}
            activeUser={activeUser}
            unreadCounts={unreadCounts}
            isLoading={usersLoading}
            error={usersError}
            onSelectUser={(selectedUser) => {
              void selectUser(selectedUser)
            }}
            onRetry={() => {
              void refreshUsers()
            }}
          />
          <ChatWindow
            activeUser={activeUser}
            currentUserId={user?.id ?? null}
            messages={messages}
            isLoading={messagesLoading}
            error={messagesError}
            isConnected={isConnected}
            connectionError={connectionError}
            isSending={isSending}
            onSend={sendMessage}
          />
        </div>
      </main>
    </div>
  )
}

