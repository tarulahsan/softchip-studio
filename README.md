# 🚀 SoftChip Studio

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=for-the-badge) ![License](https://img.shields.io/badge/License-Personal%20%7C%20Commercial-blue?style=for-the-badge)

**Build Intelligent Data Pipelines Without Code**

**Visual workflow automation meets AI - Like n8n meets hardware design**

[🌐 Live Demo](#) • [📖 Documentation](#-quick-start) • [🤝 Contributing](#contributing) • [📄 License](#license)

</div>

---

## 🎯 What is SoftChip Studio?

SoftChip Studio is a **visual drag-and-drop platform** for building AI-powered data processing pipelines and workflow automation — all without writing code. Think of it as combining the best of n8n's workflow automation with AI capabilities in a hardware-inspired visual interface.
Connect chips like circuit components to build powerful data processing pipelines that leverage GPT-4, Claude, Kimi, Qwen, and other AI models.

---

## ✨ Key Features

### 🤖 Multi-Provider AI Integration
SoftChip Studio supports **all major AI providers** with a bring-your-own-key model:
| Provider | Models | Capabilities |
|----------|--------|--------------|
| **OpenAI** | GPT-4o, GPT-4, GPT-3.5 | Chat, Image Generation, Embeddings, Vision |
| **Anthropic** | Claude 3.5 Sonnet, Claude 3 Opus, Haiku | Chat, Analysis, Long Context |
| **ZAI** | Z-AI Pro, Z-AI Standard | Chat, Analysis |
| **Kimi (Moonshot)** | moonshot-v1-8k/32k/128k | Long context chat, Document analysis |
| **Qwen** | Qwen-Turbo, Qwen-Plus, Qwen-Max | Chat, Analysis, Multilingual |
| **Custom APIs** | Any OpenAI-compatible | Full flexibility for custom endpoints |

### 🧩 60+ Functional Chips

| Category | Count | Key Chips |
|----------|-------|-----------|
| **AI & LLM** | 13 | AI Chat, Image Generator, Vision, Embeddings, Summarizer, Translator, Code Generator, Sentiment |
| **Workflow** | 6 | Trigger, Loop, Merge, Delay, Condition |
| **Connectors** | 4 | HTTP Request, Webhook Receiver |
| **Input** | 6 | Audio File, CSV, JSON, Image, Text, Microphone |
| **Output** | 6 | Audio Player, Waveform, Spectrum, Data Table, Download |
| **Signal Processing** | 6 | FFT, FIR Filter, Signal Generator, Envelope |
| **Data** | 4 | JSON Parser, Base64, CSV Parser |
| **Math** | 3 | Calculator, Statistics, PID Controller |
| **Logic** | 4 | AND, OR, NOT, Comparator |
| **Protocol** | 4 | UART Encoder/Decoder, Modbus RTU |
| **Security** | 2 | Hash (SHA-256), Encryption |

### 🔄 Workflow Automation (n8n-like)
Build complex automated workflows with visual tools:
- **Workflow Triggers** - Manual, webhook, scheduled execution
- **Conditional Branching** - If/else logic with multiple operators
- **Loops** - Iterate over arrays and process in batches
- **Parallel Execution** - Run multiple branches simultaneously
- **Merge** - Combine results from parallel branches
- **Delays** - Time-based workflow control

- **Error Handling** - Graceful failure with fallbacks

### 📊 Real Data Processing
- **Audio Processing** - Upload real WAV/MP3 files, visualize waveforms, analyze frequencies with FFT
- **CSV/Excel** - Parse spreadsheets, transform data, export results
- **JSON APIs** - Fetch API data, transform, and process
- **Image Analysis** - Upload images, analyze with AI Vision
- **Real-time Audio** - Capture from microphone, process live

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** or **Bun** runtime
- npm, yarn, pnpm, or bun package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/tarulahsan/softchip-studio.git
cd softchip-studio

# Install dependencies
bun install
# OR with npm
npm install

# Start development server
bun run dev
# OR
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
bun run build
bun run start
```

### Deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tarulahsan/softchip-studio)

1. Click the button above
2. Connect your GitHub account
3. Vercel will automatically deploy
4. Your app will be live at `your-app.vercel.app`

---

## 📖 Documentation

### Setting Up AI Providers
1. Open the **Circuit Builder**
2. Click the **"AI Providers"** button in the toolbar
3. Enter your API key for your preferred provider:
   - OpenAI: Get keys from [platform.openai.com](https://platform.openai.com)
   - Anthropic: Get keys from [console.anthropic.com](https://console.anthropic.com)
   - Kimi: Get keys from [platform.moonshot.cn](https://platform.moonshot.cn)
   - Qwen: Get keys from [dashscope.console.aliyun.com](https://dashscope.console.aliyun.com)
4. Keys are stored locally in your browser (never sent to servers)
5. Start building AI-powered workflows!

### Building Your First AI Pipeline
1. **Add Input Chip** → Drag a "Text Input" chip onto the canvas
2. **Add AI Chip** → Drag an "AI Chat" chip and connect the text output to it
3. **Configure** → Select your provider and model in chip settings
4. **Add Output** → Connect AI response to "Value Display"
5. **Run** → Click the Run button to execute your pipeline

### Understanding Chips
Each chip has:
- **Input Pins** (left side) - Where data enters
- **Output Pins** (right side) - Where data exits
- **Parameters** - Configuration options
- **Execute Function** - The processing logic

### Connecting Chips
1. Click on an **output pin** (right side of chip)
2. Then click on an **input pin** (left side of another chip)
3. A connection line will appear between them
4. Click Run to execute the circuit

---

## 📋 Available Templates
Get started quickly with pre-built templates:

| Template | Description | Use Case |
|----------|-------------|----------|
| AI Chatbot Pipeline | Conversational AI with memory | Customer support, virtual assistants |
| Audio Spectrum Analyzer | FFT-based audio analysis | Audio engineering, music production |
| Multi-Language Translator | Translate to any language | Internationalization, content localization |
| Document Summarizer | Summarize long documents | Research, news aggregation |
| AI Image Generator | Generate images from text | Content creation, marketing |
| AI Code Generator | Generate code from descriptions | Development acceleration |
| Sentiment Analysis | Analyze text sentiment | Social media monitoring, reviews |
| Signal Filter Pipeline | Filter and analyze signals | Audio processing, sensor data |
| HTTP API Workflow | Fetch and process API data | API integration, data pipelines |
| AI Chain Workflow | Chain multiple AI operations | Complex AI pipelines |

---

## 🎯 Use Cases

### For AI Developers
- 🚀 **Rapid Prototyping** - Quickly test AI pipelines before building production systems
- 🔄 **Multi-Model Comparison** - Compare outputs from different AI models side-by-side
- 📊 **AI Data Enrichment** - Process datasets with AI analysis
- 💬 **Conversation Design** - Design and test chatbot flows

### For Data Engineers
- 📈 **ETL Pipelines** - Build visual extract-transform-load workflows
- ⚡ **Real-time Processing** - Process live data streams
- 🔌 **API Integration** - Connect multiple APIs without coding
- 🔄 **Data Transformation** - Transform data between formats

### For Audio Engineers
- 🎵 **Spectrum Analysis** - Visualize frequency content of audio
- 🎚 **Signal Filtering** - Apply lowpass/highpass filters
- 📊 **Waveform Visualization** - See audio signals in real-time
- 🎛 **Audio Processing** - Process and modify audio files

### For IoT Developers
- 📡 **Protocol Simulation** - Test UART, Modbus protocols
- 🔧 **Data Encoding** - Encode data for transmission
- 📊 **Sensor Analysis** - Process and visualize sensor data
- 🖥️ **Embedded Prototyping** - Prototype embedded systems visually

### For Content Creators
- ✍️ **Content Generation** - Generate text, images, and code
- 🌍 **Translation** - Translate content to multiple languages
- 📝 **Summarization** - Create summaries of long content
- ❤️ **Sentiment Analysis** - Analyze audience reactions

---

## 💎 Benefits

### Why Choose SoftChip Studio?

| Feature | Benefit |
|---------|---------|
| **No Code Required** | Build complex pipelines without programming knowledge |
| **Visual Interface** | See data flow through your pipeline in real-time |
| **Multi-Provider AI** | Use any AI model - GPT, Claude, Kimi, Qwen, custom |
| **Real Data Processing** | Process actual files - audio, CSV, JSON, images |
| **Local Processing** | All processing happens in your browser - data stays private |
| **Instant Deployment** | Deploy to Vercel with one click |
| **Extensible** | Add custom chips for your specific needs |
| **Template Library** | Start quickly with 10 pre-built templates |

### Compared to Alternatives

| Feature | SoftChip Studio | n8n | LangChain |
|---------|-----------------|-----|-----------|
| Visual Builder | ✅ | ✅ | ❌ |
| AI Integration | ✅ 13 chips | Limited | ✅ |
| No Backend Required | ✅ | ❌ | ❌ |
| Real-time Execution | ✅ | ✅ | ✅ |
| Audio Processing | ✅ Built-in | ❌ | ❌ |
| Protocol Simulation | ✅ UART/Modbus | ❌ | ❌ |
| Learning Curve | Low | Medium | High |

---

## 🏗️ Architecture

```
softchip-studio/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main application (3000+ lines)
│   │   ├── layout.tsx        # Root layout with metadata
│   │   └── globals.css       # Global styles & animations
│   ├── components/
│   │   └── ui/               # 40+ shadcn/ui components
│   ├── hooks/                # Custom React hooks
│   └── lib/                  # Utility functions
├── prisma/
│   └── schema.prisma         # Database schema for projects
├── public/                   # Static assets (logo, icons)
├── package.json              # Dependencies & scripts
├── tailwind.config.ts        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── LICENSE                   # Custom license
```

---

## 🛠️ Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Framework** | Next.js | 16.x |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 4.x |
| **UI Components** | shadcn/ui (Radix) | Latest |
| **Animation** | Framer Motion | 12.x |
| **State Management** | React Hooks | 19.x |
| **Database** | Prisma (SQLite) | 6.x |
| **Icons** | Lucide React | Latest |
| **Package Manager** | Bun | 1.x |

---

## 🔒 Security & Privacy

- **API Keys Stored Locally** - Your AI API keys never leave your browser
- **No Backend Required** - All processing happens client-side
- **No Tracking** - No analytics, cookies, or user tracking
- **No Account Required** - Start building immediately
- **Open Source** - Audit every line of code

---

## 🤝 Contributing

We welcome contributions! Here's how to help:

### Ways to Contribute
- 🐛 **Report Bugs** - Open an issue with details
- 💡 **Suggest Features** - Share your ideas in discussions
- 🔧 **Add Chips** - Create new chip types
- 📖 **Improve Docs** - Help with documentation
- 🎨 **Design Templates** - Create useful templates
- 🌐 **Translate** - Add language support

### Development Setup
```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/softchip-studio.git

# Install dependencies
bun install

# Start dev server
bun run dev

# Make changes and test
# Submit a pull request
```

---

## 📄 License

**Personal Use**: Free to use for personal, educational, and non-commercial purposes.

**Commercial Use**: Requires special permission. Contact for commercial licensing.

See [LICENSE](LICENSE) file for full terms.

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) - Beautiful, accessible UI components
- [Lucide](https://lucide.dev/) - Beautiful, consistent icons
- [Framer Motion](https://www.framer.com/motion/) - Production-ready animations
- [n8n](https://n8n.io/) - Inspiration for workflow automation
- [Vercel](https://vercel.com/) - Seamless deployment platform

---

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/tarulahsan/softchip-studio/issues)
- **GitHub Discussions**: [Ask questions](https://github.com/tarulahsan/softchip-studio/discussions)

---

<div align="center">

**Built with ❤️ by [Tarul Ahsan](https://github.com/tarulahsan)**

**[⬆ Back to Top](#-softchip-studio)**

</div>
