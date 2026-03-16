# 🚀 SoftChip Studio

<div align="center">

![SoftChip Studio](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=for-the-badge) ![License](https://img.shields.io/badge/License-Personal%20%7C%20Commercial-blue?style=for-the-badge)

**Build Intelligent Data Pipelines Without Code**

**Visual workflow automation meets AI - Like n8n meets hardware design**

[🌐 Live Demo](#) • [📖 Documentation](#documentation) • [🚀 Quick Start](#quick-start) • [🤝 Contributing](#contributing)

</div>

---

## ✨ Features

### 🤖 AI Integration (NEW!)

SoftChip Studio now supports **all major AI providers** with a bring-your-own-key model:

| Provider | Models | Features |
|----------|--------|----------|
| **OpenAI** | GPT-4o, GPT-4, GPT-3.5 | Chat, Image Gen, Embeddings, Vision |
| **Anthropic** | Claude 3.5 Sonnet, Claude 3 Opus, Haiku | Chat, Analysis |
| **ZAI** | Z-AI Pro, Standard | Chat |
| **Kimi (Moonshot)** | moonshot-v1-8k/32k/128k | Long context chat |
| **Qwen** | Qwen-Turbo, Qwen-Plus, Qwen-Max | Chat, Analysis |
| **Custom** | Any OpenAI-compatible API | Full flexibility |

**AI Chips Include:**
- 🗣️ **AI Chat** - Multi-turn conversations with memory
- ✨ **AI Text Generator** - Generate any text content
- 🖼️ **AI Image Generator** - DALL-E compatible image generation
- 👁️ **AI Vision** - Analyze and describe images
- 📊 **AI Embeddings** - Text embeddings for similarity search
- 📝 **AI Summarizer** - Summarize long documents
- 🌍 **AI Translator** - Translate between any languages
- 💻 **AI Code Generator** - Generate code in any language
- 📋 **AI JSON Extractor** - Extract structured data from text
- ❤️ **AI Sentiment** - Analyze text sentiment
- 🔗 **AI Chain** - Chain multiple AI operations
- 🧠 **AI Memory** - Persistent conversation context

### 🔄 Workflow Automation

Build complex automated workflows similar to n8n:

- **Workflow Triggers** - Manual, webhook, scheduled execution
- **HTTP Requests** - Connect to any REST API
- **Webhook Receiver** - Accept incoming webhooks
- **Conditional Branching** - If/else logic
- **Loops** - Iterate over arrays
- **Delays** - Time-based workflow control
- **Merge** - Combine parallel branches

### 📡 Signal Processing

Real audio signal processing:

- **FFT** - Fast Fourier Transform for frequency analysis
- **FIR Filters** - Lowpass, highpass, bandpass
- **Signal Generator** - Sine, square, sawtooth, noise
- **Envelope Detection** - Amplitude envelope extraction
- **Normalization** - Signal normalization

### 🔌 Protocol Support

Communication protocol simulation:

- **UART Encoder/Decoder** - Serial communication frames
- **Modbus RTU** - Industrial protocol frames with CRC
- **SPI, I2C** - Bus protocols (coming soon)

### 📊 Data Processing

Handle any data format:

- **CSV Parser** - Parse and process spreadsheet data
- **JSON Parser** - Parse, validate, transform JSON
- **Base64** - Encode/decode
- **Hash** - SHA-256 hashing

---

## 🚀 Quick Start

### Option 1: Run Locally

```bash
# Clone the repository
git clone https://github.com/tarulahsan/softchip-studio.git
cd softchip-studio

# Install dependencies
bun install

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Option 2: Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tarulahsan/softchip-studio)

---

## 📖 Documentation

### Setting Up AI Providers

1. Click the **"AI Providers"** button in the builder
2. Enter your API key for your preferred provider
3. Keys are stored locally in your browser (never sent to our servers)
4. Start building AI-powered workflows!

### Building Your First AI Pipeline

1. **Add Input** - Drag a "Text Input" chip onto the canvas
2. **Add AI** - Drag an "AI Chat" chip and connect it
3. **Configure** - Select your provider and model
4. **Run** - Click the Run button to execute

### Available Templates

| Template | Description |
|----------|-------------|
| AI Chatbot Pipeline | Conversational AI with memory |
| Audio Spectrum Analyzer | FFT-based audio analysis |
| Multi-Language Translator | Translate text to any language |
| Document Summarizer | Summarize long documents |
| AI Image Generator | Generate images from text |
| AI Code Generator | Generate code from descriptions |
| Sentiment Analysis | Analyze text sentiment |
| Signal Filter Pipeline | Filter and analyze signals |
| HTTP API Workflow | Fetch and process API data |
| AI Chain Workflow | Chain multiple AI operations |

---

## 🎯 Use Cases

### For AI Developers
- Rapid prototyping of AI pipelines
- Multi-model comparison workflows
- AI-powered data enrichment
- Conversation flow design

### For Data Engineers
- ETL pipeline visualization
- Real-time data processing
- API integration workflows
- Data transformation chains

### For Audio Engineers
- Spectrum analysis
- Signal filtering
- Audio visualization
- Real-time processing

### For IoT Developers
- Protocol simulation
- Data protocol encoding
- Communication testing
- Embedded systems prototyping

---

## 🏗️ Architecture

```
softchip-studio/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main application (4000+ lines)
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── components/ui/        # 40+ shadcn/ui components
│   ├── hooks/                # Custom React hooks
│   └── lib/                  # Utility functions
├── prisma/
│   └── schema.prisma         # Database schema
├── public/                   # Static assets
└── package.json
```

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 |
| **UI Components** | shadcn/ui (Radix) |
| **Animation** | Framer Motion |
| **State** | React Hooks |
| **Database** | Prisma (SQLite) |

---

## 📋 Chip Categories

| Category | Chips | Purpose |
|----------|-------|---------|
| **AI & LLM** | 12+ | AI model integration |
| **Workflow** | 6+ | Automation control |
| **Connectors** | 4+ | External service integration |
| **Input** | 6+ | Data input methods |
| **Output** | 6+ | Data output & visualization |
| **Signal** | 6+ | Audio/signal processing |
| **Data** | 4+ | Data transformation |
| **Math** | 3+ | Mathematical operations |
| **Logic** | 4+ | Boolean operations |
| **Protocol** | 4+ | Communication protocols |
| **Security** | 2+ | Hashing, encryption |

**Total: 60+ functional chips!**

---

## 🔒 Security

- **API Keys**: Stored locally in browser localStorage
- **No Backend**: All processing happens in your browser
- **No Tracking**: No analytics or user tracking
- **Open Source**: Fully auditable code

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/softchip-studio.git

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and test
bun run dev

# Commit and push
git commit -m "Add amazing feature"
git push origin feature/amazing-feature

# Open Pull Request
```

### Ways to Contribute
- 🐛 Report bugs
- 💡 Suggest new chips
- 📖 Improve documentation
- 🎨 Design templates
- 🌐 Add translations

---

## 📄 License

**Personal Use**: Free to use for personal, educational, and non-commercial purposes.

**Commercial Use**: Requires special permission. Contact the author for commercial licensing.

See [LICENSE](LICENSE) file for full terms.

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Lucide](https://lucide.dev/) - Icon library
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [n8n](https://n8n.io/) - Workflow automation inspiration

---

<div align="center">

**Built with ❤️ by the SoftChip Studio Team**

[⬆ Back to Top](#-softchip-studio)

</div>
