# ChatTime — Project Documentation

Version: 1.0
Author: Vorn Sivfong (Snoopy)

---

## 1. Overview

ChatTime is a real-time one-to-one chat web application. Users sign up, find other users by name or email, start a conversation, and exchange text, photos and videos instantly. The app shows who is online, counts unread messages, and notifies the user when a new message arrives.

Out of scope for v1.0: emojis, GIFs and stickers are not part of ChatTime. Push notifications when the site is closed and read receipts ("seen") are left as future features.

---

## 2. Features

Authentication
- Sign up, log in and log out through Clerk
- Protected pages (only signed-in users can open the chat)
- Profile page showing the Clerk user data

Messaging
- Find users by name or email
- Start a conversation with any user
- Conversation list in the sidebar with last message
- Send and receive text messages in real time
- Message history loaded from the database

Media
- Send photos (up to 10 MB) and videos (up to 50 MB)
- Preview and upload spinner before sending
- Photos and videos shown inside the chat bubble
- Click a photo to enlarge it

Presence and notifications
- Online status dot for each user
- Unread message badges, stored in the database
- Notification sound with a mute toggle
- Toast when a message arrives in a chat that is not open
- Unread count in the browser tab title
- Browser notification (enabled with the bell button)

UI
- Responsive layout: sidebar and chat window on desktop, back button on mobile
- Loading skeletons, empty states, toast messages
- Chat search filter

---

## 3. Tech Stack

Frontend
- React (Vite)
- Tailwind CSS
- Zustand (state management)
- React Router
- Axios (API client)
- Socket.io client
- Clerk React SDK (@clerk/clerk-react)

Backend
- Node.js with Express (ES modules)
- MongoDB Atlas with Mongoose
- Socket.io server
- Clerk (@clerk/express and @clerk/backend)
- Cloudinary (media hosting) and Multer (file upload handling)

Deployment
- Backend: Render
- Frontend: Vercel
- Database: MongoDB Atlas
- Source code: GitHub

---

## 4. Architecture

ChatTime is split into two separate apps that talk to each other.

```
 Browser (React)                         Server (Express)
 ---------------                         ----------------
 Clerk sign-in  ------ token ------->    clerkMiddleware / protectRoute
 Axios requests ------ REST  ------->    routes -> controllers -> models
 Socket.io      ------ WebSocket --->    Socket.io server (token checked)
                                                  |
                                                  v
                                           MongoDB Atlas
                                           Cloudinary (media)
```

Request flow (REST)
1. The user signs in with Clerk in the browser.
2. The Axios client in src/lib/api.js attaches the Clerk session token to every request.
3. The backend clerkMiddleware reads the token, and the protectRoute middleware blocks the request if nobody is signed in.
4. A route calls a controller, the controller uses a Mongoose model to read or write MongoDB, and returns JSON.

Real-time flow (Socket.io)
1. After sign-in the frontend opens a socket and sends the Clerk token.
2. The server verifies the token with verifyToken from @clerk/backend.
3. Each user joins a personal room named after their MongoDB user id.
4. When a message is saved, the server emits "newMessage" to the receiver's room.
5. The server keeps a list of online users and broadcasts it when someone connects or disconnects.

---

## 5. Project Structure

```
chat_time/
├── backend/
│   ├── src/
│   │   ├── config/        db.js, cloudinary.js
│   │   ├── controllers/   user, conversation, message
│   │   ├── middleware/    protectRoute
│   │   ├── models/        user.model.js, conversation.model.js, message.model.js
│   │   ├── routes/        user.routes, conversation.routes, message.routes
│   │   ├── socket/        socket.js
│   │   └── index.js
│   ├── .env
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/    Sidebar, ChatWindow, MessageInput, EmptyChat, ProtectedRoute, AuthSync
    │   ├── pages/         HomePage, LoginPage, SignupPage, ProfilePage
    │   ├── stores/        useChatStore, useUserStore, useSettingsStore
    │   ├── lib/           api.js, sound.js, notify.js
    │   └── main.jsx
    ├── .env
    └── package.json
```

---

## 6. How Authentication Works (Clerk)

ChatTime does not store passwords and does not use its own JWT login. Clerk handles sign-up, login, sessions and Google sign-in.

Frontend
- main.jsx wraps the app in ClerkProvider using VITE_CLERK_PUBLISHABLE_KEY.
- LoginPage and SignupPage use Clerk's SignIn and SignUp components, styled with the appearance prop (slate and emerald colors, ChatTime logo).
- ProtectedRoute redirects signed-out visitors to the login page.

Backend
- clerkMiddleware runs on every request and reads the session token.
- protectRoute rejects requests without a signed-in user.

User sync
- Clerk owns the account, MongoDB owns the app data.
- After sign-in, the AuthSync component calls GET /api/users/me.
- The backend looks up the user by clerkId. If no document exists, it creates one with name, email and image from Clerk. The result is stored in useUserStore.

---

## 7. Database Models

User
- clerkId (unique)
- name
- email
- imageUrl
- timestamps

Conversation
- participants: array of two User ids
- lastMessage
- unread: array of { user, count } — unread counter per user
- timestamps

Message
- conversation: Conversation id
- sender: User id
- text
- mediaUrl (optional)
- mediaType (optional: "image" or "video")
- timestamps

---

## 8. REST API

All routes except the health check require a signed-in Clerk user.

```
GET    /api/health                      Health check (public)

GET    /api/users/me                    Get the current user; creates it in MongoDB on first call
GET    /api/users/search?q=term         Search users by name or email

POST   /api/conversations               Start a conversation (or return the existing one)
GET    /api/conversations               List my conversations
GET    /api/conversations/:id/messages  Get messages of a conversation
PATCH  /api/conversations/:id/read      Mark a conversation as read (clears my unread count)

POST   /api/messages                    Send a message (text and/or mediaUrl + mediaType)
POST   /api/messages/upload             Upload a photo or video to Cloudinary, returns the URL
```

---

## 9. Socket.io Events

Connection
- The client connects with the Clerk token. The server verifies it, then joins the user to their personal room.

Server to client
- onlineUsers: array of user ids currently online (sent on every connect/disconnect)
- newMessage: the saved message, sent to the receiver's room

Client behavior
- On newMessage, if the chat is open and visible, the message is appended to the chat and the conversation is marked as read.
- If the chat is not open, the unread badge increases, the notification sound plays, a toast appears, the tab title shows the unread count, and a browser notification is shown if allowed.

---

## 10. How Sending a Message Works

Text message
1. User types in MessageInput and presses send.
2. The frontend calls POST /api/messages.
3. The backend saves the Message, updates lastMessage and the receiver's unread count on the Conversation.
4. The backend emits newMessage to the receiver's room.
5. The sender sees the message immediately; the receiver gets it live.

Photo or video
1. User clicks the paperclip and picks a file. A preview and spinner appear.
2. The file is sent to POST /api/messages/upload (Multer receives it, then it is uploaded to Cloudinary). Limits: photos 10 MB, videos 50 MB.
3. The backend returns the Cloudinary URL and the media type.
4. The frontend sends the message with mediaUrl and mediaType through POST /api/messages.
5. ChatWindow shows the media inside the bubble. Photos open in a larger viewer when clicked.

---

## 11. How Users Find Each Other

1. Every user who signs in is synced into MongoDB by GET /api/users/me.
2. In the sidebar, the user types a name or email into the new chat search.
3. The frontend calls GET /api/users/search and shows matching users.
4. Selecting a user calls POST /api/conversations. If a conversation between the two already exists it is reused, otherwise a new one is created.
5. The conversation appears in both users' sidebars and the chat can start.

---

## 12. Frontend State (Zustand)

useChatStore
- conversations, selected conversation, messages
- loading states (for skeletons)
- actions: load conversations, select conversation, load messages, send message, receive live message, mark as read

useUserStore
- the current user from GET /api/users/me

useSettingsStore
- soundEnabled (saved in localStorage, controlled by the mute toggle in the sidebar header)

---

## 13. Environment Variables

Backend (backend/.env)
```
PORT=5001
MONGO_URI=your_mongodb_atlas_connection_string
CLIENT_URL=http://localhost:5173
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Frontend (frontend/.env)
```
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

Never commit real .env files. Commit .env.example files with empty values instead.

---

## 14. Running the Project Locally

Backend
```
cd backend
npm install
npm run dev
```

Frontend
```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173, sign up, then open a second browser (or private window) with another account to test live messaging.

---

## 15. Deployment

- Database: MongoDB Atlas cluster. Allow network access for the backend host.
- Backend: Render web service (supports WebSockets, so Socket.io works). Set all backend environment variables. CLIENT_URL must match the Vercel domain exactly (no trailing slash).
- Frontend: Vercel. Set VITE_API_URL, VITE_SOCKET_URL and VITE_CLERK_PUBLISHABLE_KEY, then redeploy so the build picks them up.
- Note: on a free Render plan the backend sleeps after inactivity, so the first request can take a while to wake up.

---

## 16. Testing Checklist

- Sign up, log in, log out
- Protected pages redirect when signed out
- /api/users/me creates the user in MongoDB
- Search finds another user by name and email
- Start a chat between two accounts
- Messages arrive live without refreshing
- Online dot appears and disappears
- Unread badge, toast, sound, tab title count work when the chat is closed
- Photo and video upload, display and enlarge work
- File size limits are enforced
- Layout works on desktop and on a phone

---

## 17. Release Checklist (v1.0)

- No secrets in the repository
- .env.example files added for backend and frontend
- README with features, stack, architecture and screenshots
- Live demo link added
- Repository cleaned up and made public

---

## 18. Future Features

- Read receipts ("seen")
- Last seen time
- Date separators between messages
- Push notifications when the site is closed
- Group chats