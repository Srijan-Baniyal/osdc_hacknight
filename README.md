# pageMind

> AI-powered research assistant that helps you explore and analyze web content with source-restricted intelligence

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.0.1-black?style=flat&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.0-61dafb?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?style=flat&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat&logo=mongodb)
![Perplexity](https://img.shields.io/badge/Perplexity-AI-purple?style=flat)

</div>

## ✨ Features

### 🧠 **AI-Powered Research**
- Source-restricted research assistant powered by Perplexity AI's `sonar-reasoning` model
- Chat-based interface for natural conversation flow
- Real-time streaming responses with structured thinking and answers
- Custom API key support for personalized usage

### 💬 **Intelligent Chat System**
- Multi-session conversation management
- Persistent chat history stored in MongoDB
- Session resumption and continuation
- Token usage tracking (input/output/total)
- Response time and source count metrics

### 🎨 **Modern UI/UX**
- Immersive WebGL-powered landing page with fluid shader effects
- Custom cursor and grain overlay for premium feel
- Horizontal scrolling portfolio-style landing
- Dark/Light theme support with smooth transitions
- Responsive design across all devices

### 🔐 **Authentication & Security**
- Clerk authentication integration
- User-specific chat sessions and history
- Secure API key management
- Protected API routes

### 📊 **Dashboard Features**
- Clean, organized chat interface
- Collapsible "thinking" sections showing AI reasoning
- Source citations display
- Message metadata (tokens, duration, sources)
- Real-time streaming with smooth animations
- Stop generation capability

### 🎭 **Visual Components**
- **Landing Sections**:
  - Hero section with animated WebGL shaders
  - Work showcase
  - Services overview
  - About section
  - Contact form
- **Interactive Elements**:
  - Magnetic buttons with hover effects
  - Smooth scroll navigation
  - Custom cursor tracking
  - Touch-optimized mobile experience

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16.0.1 (App Router)
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS 4.1.16
- **Components**: Radix UI, shadcn/ui
- **Animations**: Framer Motion principles, Custom CSS
- **WebGL**: Shaders library for visual effects
- **Markdown**: Streamdown for streaming markdown rendering

### Backend
- **API Routes**: Next.js API handlers
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Clerk
- **AI Integration**: Perplexity AI SDK (@ai-sdk/perplexity)
- **Streaming**: Vercel AI SDK

### Development
- **Language**: TypeScript 5.9.3
- **Linting**: ESLint 9.39.0
- **Package Manager**: Bun
- **Form Handling**: React Hook Form + Zod validation
- **State Management**: TanStack Query

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- MongoDB Atlas account
- Clerk account
- Perplexity API key (optional for custom usage)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd osdc_hacknight
```

2. **Install dependencies**
```bash
bun install
# or
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Perplexity AI (Default key for the app)
PERPLEXITY_API_KEY=your_perplexity_api_key

# Optional: GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

4. **Run the development server**
```bash
bun dev
# or
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
osdc_hacknight/
├── app/
│   ├── api/
│   │   └── chat/
│   │       ├── stream/           # Streaming chat endpoint
│   │       ├── history/          # Chat history retrieval
│   │       └── session/          # Session management
│   ├── dashboard/                # Dashboard pages
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/
│   ├── Dashboard/
│   │   ├── Dashboard.tsx         # Main chat interface
│   │   ├── DashboardNavbar.tsx   # Dashboard navigation
│   │   └── DashBoardSidebar.tsx  # Sidebar with sessions
│   ├── section/                  # Landing page sections
│   ├── ui/                       # Reusable UI components
│   ├── CustomCursor.tsx          # Custom cursor component
│   ├── GrainOverlay.tsx          # Visual grain effect
│   ├── MagneticButton.tsx        # Interactive button
│   └── ThemeSwitcher.tsx         # Theme toggle
├── context/
│   └── ChatContext.tsx           # Chat state management
├── schemas/
│   ├── ChatSession.ts            # MongoDB chat schema
│   └── MongoDBClientConnection.ts # Database connection
├── hooks/                        # Custom React hooks
├── lib/                          # Utility functions
└── public/                       # Static assets
```

## 🔑 Key Features Explained

### Source-Restricted Research
pageMind is designed to be a **source-restricted research assistant**. Unlike typical AI chatbots that can search the entire internet, pageMind:
- Only reads URLs explicitly provided by users
- Never hallucinates beyond provided sources
- Cites specific URLs and sections in answers
- Refuses to answer questions outside provided sources

### Streaming Architecture
The chat system uses Server-Sent Events (SSE) for real-time streaming:
```typescript
event: conversation    # Session ID
event: delta          # Incremental text chunks
event: metadata       # Token usage, duration, sources
event: done           # Completion signal
```

### AI Response Structure
Assistant responses are parsed into three sections:
- **Thinking**: AI's reasoning process (collapsible)
- **Answer**: Main response content
- **Sources**: Citations and references

## 📊 Usage Metrics

Each AI response tracks:
- **Input Tokens**: Prompt + history token count
- **Output Tokens**: Generated response tokens
- **Total Tokens**: Combined usage
- **Duration**: Response generation time
- **Source Count**: Number of sources cited
- **API Key Type**: Default or custom key usage

## 🎨 Customization

### Theme Customization
Modify `app/globals.css` for theme variables:
```css
:root {
  --background: ...;
  --foreground: ...;
  /* Add your custom colors */
}
```

### Shader Effects
Customize WebGL effects in `app/page.tsx`:
```tsx
<Swirl
  colorA="#1275d8"
  colorB="#e19136"
  speed={0.8}
  detail={0.8}
  // Adjust parameters
/>
```

## 🧪 Development

### Build for Production
```bash
bun run build
# or
npm run build
```

### Lint Code
```bash
bun run lint
# or
npm run lint
```

### Start Production Server
```bash
bun start
# or
npm start
```

## 🔒 Security Notes

- Never commit `.env` file
- Rotate API keys regularly
- Use environment variables for all secrets
- Implement rate limiting for production
- Monitor token usage to control costs

## 📝 API Endpoints

### `POST /api/chat/stream`
Stream AI responses
```typescript
Body: {
  prompt: string;
  conversationId?: string;
  apiKey?: string;
}
```

### `GET /api/chat/history`
Retrieve user's chat sessions

### `GET /api/chat/session/[sessionId]`
Get specific session details

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📀 Video

https://github.com/user-attachments/assets/f7317b77-5bf6-4562-be12-38d455c1565c

## 🙏 Acknowledgments

- [Perplexity AI](https://www.perplexity.ai/) for the AI models
- [Vercel](https://vercel.com/) for the AI SDK
- [Clerk](https://clerk.com/) for authentication
- [shadcn/ui](https://ui.shadcn.com/) for UI components
- [Radix UI](https://www.radix-ui.com/) for accessible primitives

## 📧 Support

For support, please open an issue in the repository or contact the maintainers.

---

<div align="center">
Made with ❤️ for OSDC Hack Night
</div>
