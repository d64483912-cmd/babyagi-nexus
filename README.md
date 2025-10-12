# BabyAGI Nexus 2.0

<div align="center">
  <img src="https://img.shields.io/badge/AI-Autonomous-purple" />
  <img src="https://img.shields.io/badge/React-18.3-blue" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-green" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue" />
</div>

## Overview

**BabyAGI Nexus 2.0** is a production-ready autonomous AI agent platform built on modern web technologies. It provides a complete system for orchestrating AI agents, managing task queues, and extending capabilities through a flexible plugin system.

### Key Features

- 🤖 **Autonomous Agent Orchestration** - Deploy and manage multiple AI agents with priority-based task queues
- 🔌 **Extensible Plugin System** - Web search, database access, HTTP APIs, and code execution plugins
- 🌐 **OpenRouter Integration** - Runtime model discovery and automatic free model selection
- 📊 **Real-time Dashboard** - Monitor agent status, tasks, and logs in real-time
- 🗄️ **Vector Memory Store** - Persistent agent memory with semantic search capabilities
- 🔒 **Production Security** - Row-level security, authentication, and audit logging

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Dashboard │  │  Tasks   │  │ Plugins  │  │ Settings │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                    Supabase Client
                            │
┌─────────────────────────────────────────────────────────────┐
│                  Supabase Backend                           │
│  ┌──────────────────┐      ┌──────────────────┐           │
│  │  PostgreSQL DB   │      │  Edge Functions  │           │
│  │  - Agents        │      │  - discover-models│           │
│  │  - Tasks         │      │  - execute-agent  │           │
│  │  - Memories      │      │                   │           │
│  │  - Plugins       │      │                   │           │
│  │  - Logs          │      │                   │           │
│  └──────────────────┘      └──────────────────┘           │
└─────────────────────────────────────────────────────────────┘
                            │
                      OpenRouter API
                            │
                  ┌────────┴────────┐
                  │                 │
          Free Models      Paid Models
          (Gemini, Llama)  (GPT, Claude)
```

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI**: OpenRouter (Multi-model LLM gateway)
- **Real-time**: Supabase Realtime subscriptions
- **Auth**: Supabase Auth (optional)
- **Deployment**: Lovable Platform

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (already configured)
- OpenRouter API key ([get one here](https://openrouter.ai/keys))

### Local Development

1. **Clone and install**:
```bash
git clone <your-repo-url>
cd babyagi-nexus
npm install
```

2. **Start development server**:
```bash
npm run dev
```

3. **Configure OpenRouter**:
   - Open the app at `http://localhost:5173`
   - Navigate to Settings
   - Enter your OpenRouter API key
   - Test the connection

## Usage

### Creating an Agent

1. Navigate to the Dashboard
2. Click "Create Agent"
3. Define the agent's objective
4. Configure model preferences (free models auto-selected)
5. Start the agent

### Adding Tasks

1. Go to the Tasks tab
2. Describe the task for the AI agent
3. Adjust priority as needed
4. Tasks will be executed in priority order

### Using Plugins

Available plugins:

- **Web Search**: Enable agents to search the web for information
- **PostgreSQL Database**: Direct database access for data persistence
- **HTTP API Client**: Make requests to external APIs
- **Code Executor**: Execute JavaScript/TypeScript code (sandbox)

Enable/disable plugins in the Plugins tab.

### OpenRouter Model Selection

The system automatically:
- Discovers available models at runtime
- Prioritizes free/community models
- Falls back to paid models if configured
- Caches model list for performance

## Database Schema

### Core Tables

- `agents` - Agent configurations and status
- `tasks` - Task queue with priorities
- `memories` - Vector store for agent memory
- `plugins` - Plugin registry
- `agent_logs` - Structured logging

### Security

All tables use Row-Level Security (RLS):
- Users can only access their own agents and tasks
- Plugins are read-only for authenticated users
- Logs are scoped to user's agents

## Edge Functions

### `discover-models`

Discovers and categorizes OpenRouter models.

**Endpoint**: `/functions/v1/discover-models`

**Request**:
```json
{
  "apiKey": "sk-or-v1-..."
}
```

**Response**:
```json
{
  "success": true,
  "freeModels": [...],
  "paidModels": [...],
  "recommended": {
    "chat": "google/gemini-2.0-flash-exp:free",
    "embedding": "text-embedding-3-small"
  }
}
```

### `execute-agent`

Executes an agent's pending tasks.

**Endpoint**: `/functions/v1/execute-agent`

**Request**:
```json
{
  "agentId": "uuid",
  "apiKey": "sk-or-v1-...",
  "model": "google/gemini-2.0-flash-exp:free"
}
```

## Environment Variables

Required environment variables (already configured):

```env
VITE_SUPABASE_URL=https://bnjthwrpigvchbhsmfec.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

User-provided (in Settings UI):
- OpenRouter API Key

## Deployment

### Lovable Platform (Recommended)

Already deployed! Just push to your repository.

### Vercel Deployment

1. **Frontend**:
```bash
vercel deploy --prod
```

2. **Environment Variables**:
Set in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Docker Deployment

```bash
docker build -t babyagi-nexus .
docker run -p 5173:5173 babyagi-nexus
```

## Development

### Project Structure

```
babyagi-nexus/
├── src/
│   ├── components/
│   │   └── agent/
│   │       ├── AgentDashboard.tsx
│   │       ├── TaskQueue.tsx
│   │       ├── PluginManager.tsx
│   │       └── SettingsPanel.tsx
│   ├── pages/
│   │   └── Index.tsx
│   ├── integrations/
│   │   └── supabase/
│   └── index.css
├── supabase/
│   ├── functions/
│   │   ├── discover-models/
│   │   └── execute-agent/
│   ├── migrations/
│   └── config.toml
└── README.md
```

### Testing

```bash
# Run type checking
npm run type-check

# Build for production
npm run build
```

## API Documentation

### Supabase Client Methods

```typescript
import { supabase } from '@/integrations/supabase/client';

// Create an agent
const { data: agent } = await supabase
  .from('agents')
  .insert({
    name: 'Research Agent',
    objective: 'Research and summarize AI trends',
    user_id: user.id
  })
  .select()
  .single();

// Add a task
const { data: task } = await supabase
  .from('tasks')
  .insert({
    agent_id: agent.id,
    description: 'Analyze latest AI papers',
    priority: 5
  })
  .select()
  .single();

// Execute agent
const { data } = await supabase.functions.invoke('execute-agent', {
  body: {
    agentId: agent.id,
    apiKey: 'your-openrouter-key',
    model: 'google/gemini-2.0-flash-exp:free'
  }
});
```

## Plugin Development

Create custom plugins by implementing the plugin interface:

```typescript
interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  category: 'search' | 'database' | 'api' | 'utility';
  
  register(app: Application): void;
  execute(context: ExecutionContext, args: any): Promise<any>;
}
```

## Roadmap

- [ ] Multi-agent collaboration
- [ ] Workflow templates
- [ ] Advanced plugin marketplace
- [ ] Real-time collaboration
- [ ] Mobile app (React Native)
- [ ] Voice interface

## Troubleshooting

### OpenRouter Connection Issues

- Verify API key is valid
- Check that free models are available
- Review Edge Function logs in Supabase dashboard

### Database Issues

- Check RLS policies are enabled
- Verify user is authenticated (if required)
- Review migration status

### Performance

- Enable connection pooling
- Use Supabase Realtime for live updates
- Cache OpenRouter model discovery

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- Documentation: [Lovable Docs](https://docs.lovable.dev)
- Supabase: [Supabase Docs](https://supabase.com/docs)
- OpenRouter: [OpenRouter Docs](https://openrouter.ai/docs)

---

**Built with ❤️ using Lovable, Supabase, and OpenRouter**
