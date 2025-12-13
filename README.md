# Real-Time Request Application

A scalable, secure real-time Request Application built with React, Node.js, Socket.io, and MongoDB.

## Features

- ✅ Real-time messaging with Socket.io
- ✅ User authentication (JWT)
- ✅ Private and group chats
- ✅ Online/offline status indicators
- ✅ Typing indicators
- ✅ Message read receipts
- ✅ Responsive UI with Tailwind CSS
- ✅ Rate limiting for security
- ✅ Input validation and sanitization
- ✅ Optimistic UI updates
- ✅ Automatic reconnection handling

## Tech Stack

**Frontend:**
- React 19 with TypeScript
- Vite for fast development
- Socket.io Client for real-time communication
- Tailwind CSS + shadcn/ui for styling
- React Router for navigation

**Backend:**
- Node.js + Express
- Socket.io for WebSocket connections
- MongoDB with Mongoose ODM
- JWT for authentication
- bcrypt for password hashing
- express-rate-limit for security

## Prerequisites

- Node.js 20.19+ or 22.12+ (current version 20.17.0 may cause Vite issues - upgrade recommended)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chat-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/RequestApps
   JWT_SECRET=your_super_secret_jwt_key_change_this
   JWT_EXPIRE=7d
   NODE_ENV=development
   CLIENT_URL=http://localhost:8080
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Create a demo user (optional)**
   ```bash
   node server/scripts/createDemoUser.js
   ```

## Development

Run both frontend and backend concurrently:

```bash
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:3000

## Production Build

1. **Build the frontend**
   ```bash
   npm run build:frontend
   ```

2. **Start the server**
   ```bash
   npm start
   ```

The server will serve the built frontend from the `dist` folder.

## Project Structure

```
chat-app/
├── server/                 # Backend code
│   ├── middleware/        # Authentication, rate limiting
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── utils/            # Socket handler, helpers
│   ├── scripts/          # Utility scripts
│   └── server.js         # Express server setup
├── src/                   # Frontend code
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilities
│   └── App.tsx          # Main app component
├── public/              # Static assets
└── dist/               # Production build (generated)
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/users` - Get all users (except current)

### Chat
- `POST /api/chat/rooms` - Create a new room
- `GET /api/chat/rooms` - Get all user's rooms
- `GET /api/chat/rooms/:roomId/messages` - Get room messages
- `POST /api/chat/rooms/private` - Create/get private chat
- `POST /api/chat/rooms/private-by-username` - Create/get private chat by username

## Socket Events

### Client → Server
- `room:join` - Join a specific room
- `message:send` - Send a message
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator
- `message:read` - Mark message as read

### Server → Client
- `message:new` - New message received
- `user:status` - User online/offline status
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `message:read` - Message read confirmation
- `message:error` - Message error

## Security Features

1. **Rate Limiting**
   - API: 100 requests per 15 minutes
   - Auth: 5 failed attempts per 15 minutes
   - Messages: 30 per minute

2. **Authentication**
   - JWT tokens with 7-day expiration
   - HttpOnly cookies
   - Password hashing with bcrypt (12 rounds)

3. **Input Validation**
   - All user inputs sanitized
   - Length limits enforced
   - Type validation

4. **CORS**
   - Configured for specific origins
   - Credentials support enabled

## Scalability Considerations

1. **Database Indexing**
   - Indexed fields: email, username, room participants, messages
   - Compound indexes for common queries

2. **Socket.io**
   - Room-based broadcasting to reduce overhead
   - Reconnection handling with automatic room rejoin

3. **State Management**
   - Optimistic updates for better UX
   - Efficient re-rendering with proper React patterns

4. **API Design**
   - Pagination support (max 100 messages per request)
   - Lazy loading of messages

## Environment Variables

**Backend (.env)**
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/RequestApps
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
NODE_ENV=production
CLIENT_URL=https://yourdomain.com
```

**Frontend (.env.production)**
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

## Deployment

### Backend (Node.js)

1. Set NODE_ENV=production
2. Ensure MongoDB is accessible
3. Set strong JWT_SECRET
4. Configure CLIENT_URL to frontend domain
5. Enable HTTPS in production

### Frontend (React)

1. Build: `npm run build:frontend`
2. Serve `dist` folder via backend or CDN
3. Set VITE_API_BASE_URL in .env.production

### Recommended Platforms

- **Backend**: Heroku, Railway, DigitalOcean, AWS EC2
- **Database**: MongoDB Atlas (cloud)
- **Frontend**: Netlify, Vercel, or served by backend

## Demo Credentials

If you ran the createDemoUser script:
- Email: alice@example.com
- Password: password123

## Troubleshooting

**Socket connection fails:**
- Check if backend is running on correct port
- Verify CORS settings
- Ensure token is stored in localStorage

**Vite build fails:**
- Upgrade Node.js to 20.19+ or 22.12+
- Clear node_modules and reinstall

**MongoDB connection error:**
- Verify MongoDB is running
- Check MONGODB_URI in .env

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
