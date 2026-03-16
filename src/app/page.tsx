'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu, Zap, Settings, Play, Pause, Trash2, Download, Upload,
  ArrowRight, Check, X, ChevronRight, ChevronLeft,
  CircuitBoard, Code, FileJson, Database, Globe, Shield, Signal,
  Timer, Calculator, Filter, BarChart3, Layers, Box, Cable, Grid3x3,
  Home, BookOpen, Menu, Sparkles, Target, TrendingUp,
  Eye, RefreshCw, Info, Lightbulb, Rocket, Terminal, Layers2, Workflow,
  Mic, Volume2, FileAudio, FileSpreadsheet, FileImage, Link, Activity,
  Headphones, Speaker, Save, Copy, FileDown, FolderOpen, Plus, Minus,
  Bot, MessageSquare, Image as ImageIcon, Languages, Send, Webhook,
  Mail, Cloud, Server, Repeat, GitBranch, Merge, Clock, Key, Brain,
  Wand2, FileText, Speech, AudioWaveform, Heart, Code2, Braces
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

import ZAI from 'z-ai-web-dev-sdk'

// ============================================================================
// TYPES
// ============================================================================

type PinType = 'number' | 'string' | 'boolean' | 'array' | 'object' | 'buffer' | 'any' | 'audio' | 'image'
type ChipCategory = 'signal' | 'communication' | 'logic' | 'data' | 'math' | 'security' | 'flow' | 'io' | 'input' | 'output' | 'visual' | 'ai' | 'workflow' | 'connector'

type View = 'home' | 'builder' | 'tutorials'

interface Pin {
  id: string
  name: string
  type: PinType
  required: boolean
  defaultValue?: unknown
  description?: string
}

interface ChipDefinition {
  id: string
  name: string
  category: ChipCategory
    description: string
    icon: React.ReactNode
    color: string
    inputs: Pin[]
    outputs: Pin[]
    params?: { name: string; type: string; default: unknown; description?: string }[]
    isAsync?: boolean
    execute: (inputs: Record<string, unknown>, params: Record<string, unknown>, state?: Record<string, unknown>, context?: AIContext) => Record<string, unknown> | Promise<Record<string, unknown>>
}

interface PlacedChip {
    instanceId: string
    chipId: string
    position: { x: number; y: number }
    params: Record<string, unknown>
    inputValues: Record<string, unknown>
    outputValues: Record<string, unknown>
}

interface Connection {
    id: string
    fromChip: string
    fromPin: string
    toChip: string
    toPin: string
}

interface Circuit {
    chips: PlacedChip[]
    connections: Connection[]
}

interface AIProvider {
    name: string
    apiKey: string
    baseUrl?: string
    models?: string[]
}

interface AIContext {
    providers: Record<string, AIProvider>
    getProvider: (name: string) => AIProvider | null
}

interface AIProviders {
    openai: AIProvider
    anthropic: AIProvider
    zai: AIProvider
    kimi: AIProvider
    qwen: AIProvider
    custom: AIProvider
}

// ============================================================================
// AI PROVIDER MANAGEMENT
// ============================================================================

const DEFAULT_PROVIDERS: AIProviders = {
    openai: { name: 'OpenAI', apiKey: '', baseUrl: 'https://api.openai.com/v1', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
    anthropic: { name: 'Anthropic', apiKey: '', baseUrl: 'https://api.anthropic.com/v1', models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'] },
    zai: { name: 'ZAI', apiKey: '', baseUrl: 'https://api.z.ai/v1', models: ['z-ai-pro', 'z-ai-standard'] },
    kimi: { name: 'Kimi', apiKey: '', baseUrl: 'https://api.moonshot.cn/v1', models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'] },
    qwen: { name: 'Qwen', apiKey: '', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', models: ['qwen-turbo', 'qwen-plus', 'qwen-max'] },
    custom: { name: 'Custom OpenAI-Compatible', apiKey: '', baseUrl: '', models: [] }
}

function loadProviders(): AIProviders {
    if (typeof window === 'undefined') return DEFAULT_PROVIDERS
    try {
        const saved = localStorage.getItem('softchip-ai-providers')
        if (saved) {
            return { ...DEFAULT_PROVIDERS, ...JSON.parse(saved) }
        }
    } catch { }
    return DEFAULT_PROVIDERS
}

}

function saveProviders(providers: AIProviders) {
    if (typeof window === 'undefined') return
    localStorage.setItem('softchip-ai-providers', JSON.stringify(providers))
}

async function callAI(
    provider: AIProvider,
    messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>,
    params: { model?: string; temperature?: number; maxTokens?: number }
): Promise<string> {
    if (!provider.apiKey) {
        throw new Error(`API key not configured for ${provider.name}`)
    }

    const model = params.model || provider.models?.[0] || 'gpt-4o-mini'
    const baseUrl = provider.baseUrl || 'https://api.openai.com/v1'

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.apiKey}`,
            ...(provider.name === 'Anthropic' ? { 'x-api-key': provider.apiKey, 'anthropic-version': '2023-06-01' } : {})
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: params.temperature ?? 0.7,
            max_tokens: params.maxTokens ?? 2000
        })
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`AI API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
}

async function callAIImage(provider: AIProvider, prompt: string, size: string = '1024x1024'): Promise<string> {
    if (!provider.apiKey) {
        throw new Error(`API key not configured for ${provider.name}`)
    }

    const baseUrl = provider.baseUrl || 'https://api.openai.com/v1'

    const response = await fetch(`${baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({
            prompt,
            n: 1,
            size,
            response_format: 'url'
        })
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Image API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return data.data?.[0]?.url || data.data?.[0]?.b64_json || ''
}

async function callAIEmbedding(provider: AIProvider, text: string, model?: string): Promise<number[]> {
    if (!provider.apiKey) {
        throw new Error(`API key not configured for ${provider.name}`)
    }

    const baseUrl = provider.baseUrl || 'https://api.openai.com/v1'
    const embeddingModel = model || 'text-embedding-ada-002'

    const response = await fetch(`${baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({
            input: text,
            model: embeddingModel
        })
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Embedding API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return data.data?.[0]?.embedding || []
}

// ============================================================================
// CHIP LIBRARY - 70+ FUNCTIONAL CHIPS INCLUDING AI
// ============================================================================

const CHIP_LIBRARY: ChipDefinition[] = [
    // ==================== INPUT CHIPS ====================
    {
        id: 'audio-file-input',
        name: 'Audio File',
        category: 'input',
        description: 'Upload and decode audio files (WAV, MP3)',
        icon: <FileAudio className="w-4 h-4" />,
        color: '#22c55e',
        inputs: [],
        outputs: [
            { id: 'samples', name: 'Samples', type: 'array', description: 'Audio samples (normalized -1 to 1)' },
            { id: 'sampleRate', name: 'Sample Rate', type: 'number', description: 'Sample rate in Hz' },
            { id: 'duration', name: 'Duration', type: 'number', description: 'Duration in seconds' },
            { id: 'channels', name: 'Channels', type: 'number', description: 'Number of channels' }
        ],
        params: [
            { name: 'fileData', type: 'string', default: '', description: 'Base64 encoded audio data' },
            { name: 'fileName', type: 'string', default: '', description: 'File name' }
        ],
        isAsync: true,
        execute: async (inputs, params) => {
            const fileData = params.fileData as string
            if (!fileData) return { samples: [], sampleRate: 44100, duration: 0, channels: 1 }
            try {
                const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
                const binaryString = atob(fileData.split(',')[1])
                const bytes = new Uint8Array(binaryString.length)
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i)
                }
                
                const audioBuffer = await audioContext.decodeAudioData(bytes.buffer)
                const samples = Array.from(audioBuffer.getChannelData(0))
                
                return {
                    samples,
                    sampleRate: audioBuffer.sampleRate,
                    duration: audioBuffer.duration,
                    channels: audioBuffer.numberOfChannels
                }
            } catch {
                return { samples: [], sampleRate: 44100, duration: 0, channels: 1 }
            }
        }
    },
    {
        id: 'microphone-input',
        name: 'Microphone',
        category: 'input',
        description: 'Capture real-time audio from microphone',
        icon: <Mic className="w-4 h-4" />,
        color: '#22c55e',
        inputs: [],
        outputs: [
            { id: 'samples', name: 'Samples', type: 'array', description: 'Captured audio samples' },
            { id: 'sampleRate', name: 'Sample Rate', type: 'number', description: 'Sample rate in Hz' }
        ],
        params: [
            { name: 'duration', type: 'number', default: 1, description: 'Capture duration in seconds' },
            { name: 'captured', type: 'string', default: '', description: 'Captured samples as JSON' }
        ],
        execute: (inputs, params) => {
            const captured = params.captured as string
            if (captured) {
                try {
                    const data = JSON.parse(captured)
                    return { samples: data.samples || [], sampleRate: data.sampleRate || 44100 }
                } catch {
                    return { samples: [], sampleRate: 44100 }
                }
            }
            return { samples: [], sampleRate: 44100 }
        }
    },
    {
        id: 'csv-file-input',
        name: 'CSV File',
        category: 'input',
        description: 'Upload and parse CSV files',
        icon: <FileSpreadsheet className="w-4 h-4" />,
        color: '#22c55e',
        inputs: [],
        outputs: [
            { id: 'rows', name: 'Rows', type: 'array', description: 'Array of row objects' },
            { id: 'headers', name: 'Headers', type: 'array', description: 'Column headers' },
            { id: 'count', name: 'Count', type: 'number', description: 'Number of rows' }
        ],
        params: [
            { name: 'fileData', type: 'string', default: '', description: 'CSV content' },
            { name: 'delimiter', type: 'string', default: ',', description: 'Column delimiter' },
            { name: 'hasHeader', type: 'boolean', default: true, description: 'First row is header' }
        ],
        execute: (inputs, params) => {
            const fileData = params.fileData as string || ''
            const delimiter = (params.delimiter as string) || ','
            const hasHeader = params.hasHeader !== false
            
            
            if (!fileData) {
                return { rows: [], headers: [], count: 0 }
            }
            
            const lines = fileData.split('\n').filter(l => l.trim())
            if (lines.length === 0) {
                return { rows: [], headers: [], count: 0 }
            }
            
            let headers: string[] = []
            const rows: Record<string, string>[] = []
            
            lines.forEach((line, idx) => {
                const values = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''))
                if (idx === 0 && hasHeader) {
                    headers = values
                } else {
                    const row: Record<string, string> = {}
                    values.forEach((val, vIdx) => {
                        row[headers[vIdx] || `col${vIdx}`] = val
                    })
                    rows.push(row)
                }
            })
            
            return { rows, headers, count: rows.length }
        }
    },
    {
        id: 'json-file-input',
        name: 'JSON File',
        category: 'input',
        description: 'Upload and parse JSON files',
        icon: <FileJson className="w-4 h-4" />,
        color: '#22c55e',
        inputs: [],
        outputs: [
            { id: 'data', name: 'Data', type: 'object', description: 'Parsed JSON data' },
            { id: 'valid', name: 'Valid', type: 'boolean', description: 'Is valid JSON' }
        ],
        params: [{ name: 'fileData', type: 'string', default: '', description: 'JSON content' }],
        execute: (inputs, params) => {
            const fileData = params.fileData as string || ''
            if (!fileData) {
                return { data: null, valid: false }
            }
            
            try {
                const data = JSON.parse(fileData)
                return { data, valid: true }
            } catch {
                return { data: null, valid: false }
            }
        }
    },
    {
        id: 'text-input',
        name: 'Text Input',
        category: 'input',
        description: 'Manual text/number input',
        icon: <Code className="w-4 h-4" />,
        color: '#22c55e',
        inputs: [],
        outputs: [{ id: 'value', name: 'Value', type: 'any', description: 'The input value' }],
        params: [
            { name: 'value', type: 'string', default: '', description: 'Input value' },
            { name: 'type', type: 'string', default: 'string', description: 'Value type: string, number, json, array' }
        ],
        execute: (inputs, params) => {
            const value = params.value
            const type = params.type as string
            switch (type) {
                case 'number': return { value: Number(value) || 0 }
                case 'json':
                    try {
                        return { value: JSON.parse(String(value)) }
                    } catch {
                        return { value: null }
                    }
                case 'array':
                    try {
                        const parsed = JSON.parse(String(value))
                        return { value: Array.isArray(parsed) ? parsed : [parsed] }
                    } catch {
                        return { value: String(value).split(',').map(s => s.trim()) }
                    }
                default:
                    return { value: String(value) }
            }
        }
    },
    {
        id: 'image-input',
        name: 'Image Input',
        category: 'input',
        description: 'Upload and process images',
        icon: <ImageIcon className="w-4 h-4" />,
        color: '#22c55e',
        inputs: [],
        outputs: [
            { id: 'dataUrl', name: 'Data URL', type: 'string', description: 'Base64 data URL' },
            { id: 'width', name: 'Width', type: 'number', description: 'Image width' },
            { id: 'height', name: 'Height', type: 'number', description: 'Image height' }
        ],
        params: [
            { name: 'fileData', type: 'string', default: '', description: 'Base64 image data' },
            { name: 'fileName', type: 'string', default: '', description: 'File name' }
        ],
        execute: (inputs, params) => {
            return { dataUrl: params.fileData || '', width: 0, height: 0 }
        }
    },

    // ==================== OUTPUT CHIPS ====================
    {
        id: 'audio-player',
        name: 'Audio Player',
        category: 'output',
        description: 'Play audio samples as sound',
        icon: <Headphones className="w-4 h-4" />,
        color: '#f43f5e',
        inputs: [
            { id: 'samples', name: 'Samples', type: 'array', required: true },
            { id: 'sampleRate', name: 'Sample Rate', type: 'number', required: false }
        ],
        outputs: [
            { id: 'duration', name: 'Duration', type: 'number' },
            { id: 'played', name: 'Played', type: 'boolean' }
        ],
        isAsync: true,
        execute: async (inputs) => {
            const samples = inputs.samples as number[] || []
            const sampleRate = (inputs.sampleRate as number) || 44100
            if (samples.length === 0) return { duration: 0, played: false }
            }
            try {
                const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
                const audioBuffer = audioContext.createBuffer(1, samples.length, sampleRate)
                audioBuffer.getChannelData(0).set(samples)
                const source = audioContext.createBufferSource()
                source.buffer = audioBuffer
                source.connect(audioContext.destination)
                source.start()
                return { duration: samples.length / sampleRate, played: true }
            } catch {
                return { duration: samples.length / sampleRate, played: false }
            }
        }
    },
    {
        id: 'waveform-display',
        name: 'Waveform',
        category: 'visual',
        description: 'Visualize signal as waveform',
        icon: <Activity className="w-4 h-4" />,
        color: '#8b5cf6',
        inputs: [{ id: 'signal', name: 'Signal', type: 'array', required: true }],
        outputs: [
            { id: 'min', name: 'Min', type: 'number' },
            { id: 'max', name: 'Max', type: 'number' },
            { id: 'samples', name: 'Samples', type: 'number' }
        ],
        execute: (inputs) => {
            const signal = (inputs.signal as number[]) || []
            if (signal.length === 0) return { min: 0, max: 0, samples: 0 }
            return {
                min: Math.min(...signal),
                max: Math.max(...signal),
                samples: signal.length,
                _waveformData: signal
            }
        }
    },
    {
        id: 'spectrum-display',
        name: 'Spectrum',
        category: 'visual',
        description: 'Display frequency spectrum',
        icon: <BarChart3 className="w-4 h-4" />,
        color: '#8b5cf6',
        inputs: [
            { id: 'magnitude', name: 'Magnitude', type: 'array', required: true },
            { id: 'frequencies', name: 'Frequencies', type: 'array', required: false }
        ],
        outputs: [
            { id: 'peakFreq', name: 'Peak Freq', type: 'number' },
            { id: 'peakMag', name: 'Peak Mag', type: 'number' }
        ],
        execute: (inputs) => {
            const magnitude = (inputs.magnitude as number[]) || []
            if (magnitude.length === 0) return { peakFreq: 0, peakMag: 0 }
            let maxIdx = 0, maxVal = magnitude[0]
            for (let i = 1; i < magnitude.length; i++) {
                if (magnitude[i] > maxVal) {
                    maxVal = magnitude[i]
                    maxIdx = i
                }
            }
            return {
                peakFreq: frequencies[maxIdx] || maxIdx,
                peakMag: maxVal,
                _spectrumData: { magnitude, frequencies: inputs.frequencies as number[] || [] }
            }
        }
    },
    {
        id: 'data-table',
        name: 'Data Table',
        category: 'visual',
        description: 'Display data in table format',
        icon: <Database className="w-4 h-4" />,
        color: '#8b5cf6',
        inputs: [{ id: 'data', name: 'Data', type: 'array', required: true }],
        outputs: [{ id: 'count', name: 'Count', type: 'number' }],
        params: [{ name: 'maxRows', type: 'number', default: 50 }],
        execute: (inputs, params) => {
            const data = inputs.data as unknown[]
            if (!Array.isArray(data)) {
                return { count: 0, _tableData: [] }
            }
            return {
                count: data.length,
                _tableData: data.slice(0, (params.maxRows as number) || 50)
            }
        }
    },
    {
        id: 'value-display',
        name: 'Value Display',
        category: 'output',
        description: 'Display any value',
        icon: <Eye className="w-4 h-4" />,
        color: '#f43f5e',
        inputs: [{ id: 'value', name: 'Value', type: 'any', required: true }],
        outputs: [{ id: 'passthrough', name: 'Out', type: 'any' }],
        params: [{ name: 'label', type: 'string', default: 'Output' }],
        execute: (inputs, params) => ({
            return {
                passthrough: inputs.value,
                _displayValue: inputs.value,
                _displayLabel: params.label
            }
        }
    },
    {
        id: 'download-output',
        name: 'Download',
        category: 'output',
        description: 'Download data as file',
        icon: <Download className="w-4 h-4" />,
        color: '#f43f5e',
        inputs: [{ id: 'data', name: 'Data', type: 'any', required: true }],
        outputs: [{ id: 'success', name: 'Success', type: 'boolean' }],
        params: [
            { name: 'filename', type: 'string', default: 'output.json' },
            { name: 'format', type: 'string', default: 'json' }
        ],
        execute: (inputs, params) => {
            const data = inputs.data
            let content = ''
            let mimeType = 'text/plain'
            
            switch (format) {
                case 'json':
                    content = JSON.stringify(data, null, 2)
                    mimeType = 'application/json'
                    break
                case 'csv':
                    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
                        const headers = Object.keys(data[0] as object)
                        content = [headers.join(','), ...data.map(row => headers.map(h => String((row as Record<string, unknown>)[h])).join(','))].join('\n')
                        : Array.isArray(data) ? data.join('\n')
                        : String(data)
                    }
 else {
                        content = Array.isArray(data) ? String(data)
                    }

                mimeType = 'text/plain'
            }
            try {
                const blob = new Blob([content], { type: mimeType })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = params.filename as string
                a.click()
                URL.revokeObjectURL(url)
                return { success: true }
            } catch {
                return { success: false }
            }
        }
    },
    {
        id: 'image-display',
        name: 'Image Display',
        category: 'visual',
        description: 'Display an image from URL or base64',
        icon: <ImageIcon className="w-4 h-4" />,
        color: '#8b5cf6',
        inputs: [{ id: 'url', name: 'URL', type: 'string', required: true }],
        outputs: [{ id: 'displayed', name: 'Displayed', type: 'boolean' }],
        execute: (inputs) => ({ displayed: !!inputs.url, _imageUrl: inputs.url })
    },

    // ==================== AI CHIPS ====================
    {
        id: 'ai-chat',
        name: 'AI Chat',
        category: 'ai',
        description: 'Chat with AI models (GPT, Claude, Kimi, Qwen, etc.)',
        icon: <MessageSquare className="w-4 h-4" />,
        color: '#06b6d4',
        inputs: [
            { id: 'message', name: 'Message', type: 'string', required: true, description: 'User message' },
            { id: 'system', name: 'System', type: 'string', required: false, description: 'System prompt' },
            { id: 'history', name: 'History', type: 'array', required: false, description: 'Conversation history' }
        ],
        outputs: [
            { id: 'response', name: 'Response', type: 'string', description: 'AI response' },
            { id: 'tokens', name: 'Tokens', type: 'number', description: 'Tokens used (approx)' }
        ],
        params: [
            { name: 'provider', type: 'string', default: 'openai', description: 'AI provider' },
            { name: 'model', type: 'string', default: 'gpt-4o-mini', description: 'Model name' },
            { name: 'temperature', type: 'number', default: 0.7, description: 'Temperature (0-2)' },
            { name: 'maxTokens', type: 'number', default: 2000, description: 'Max tokens' }
        ],
        isAsync: true,
        execute: async (inputs, params, state, context) => {
            const provider = context?.getProvider?.(params.provider as string)
            if (!provider?.apiKey) throw new Error(`Provider ${params.provider} not configured`)

            const messages: Array<{ role: string; content: string | Array<{ role: string; content: string }> = []
            if (inputs.system) messages.push({ role: 'system', content: String(inputs.system) })
            }
            if (Array.isArray(inputs.history)) {
                (inputs.history as Array<{ role: string; content: string } >).forEach(m => messages.push(m))
            }
            messages.push({ role: 'user', content: String(inputs.message) })

            const response = await callAI(provider, messages, {
                model: params.model as string,
                temperature: params.temperature as number,
                maxTokens: params.maxTokens as number
            })

            return { response, tokens: response.length / 4 }
        }
    },
    {
        id: 'ai-text-generator',
        name: 'AI Text Generator',
        category: 'ai',
        description: 'Generate text with AI',
        icon: <Wand2 className="w-4 h-4" />,
        color: '#06b6d4',
        inputs: [{ id: 'prompt', name: 'Prompt', type: 'string', required: true }],
        outputs: [{ id: 'text', name: 'Text', type: 'string' }],
        params: [
            { name: 'provider', type: 'string', default: 'openai' },
            { name: 'model', type: 'string', default: 'gpt-4o-mini' },
            { name: 'temperature', type: 'number', default: 0.8 },
            { name: 'maxTokens', type: 'number', default: 1000 }
        ],
        isAsync: true,
        execute: async (inputs, params, state, context) => {
            const provider = context?.getProvider?.(params.provider as string)
            if (!provider?.apiKey) throw new Error(`Provider not configured`)

            const text = await callAI(provider, [{ role: 'user', content: String(inputs.prompt) }], {
                model: params.model as string,
                temperature: params.temperature as number,
                maxTokens: params.maxTokens as number
            })
            return { text }
        }
    },
    {
        id: 'ai-image-generator',
        name: 'AI Image Generator',
        category: 'ai',
        description: 'Generate images with DALL-E or compatible APIs',
        icon: <ImageIcon className="w-4 h-4" />,
        color: '#06b6d4',
        inputs: [{ id: 'prompt', name: 'Prompt', type: 'string', required: true }],
        outputs: [
            { id: 'url', name: 'URL', type: 'string' },
            { id: 'base64', name: 'Base64', type: 'string' }
        ],
        params: [
            { name: 'provider', type: 'string', default: 'openai' },
            { name: 'size', type: 'string', default: '1024x1024' }
        ],
        isAsync: true,
        execute: async (inputs, params, state, context) => {
            const provider = context?.getProvider?.(params.provider as string)
            if (!provider?.apiKey) throw new Error(`Provider not configured`)

            const url = await callAIImage(provider, String(inputs.prompt), params.size as string)
            return { url, base64: url.startsWith('http') ? '' : url :startsWith(5).length) ? true : ''(url.startsWith('data:image')) {
                url = url.startsWith('data:image'))
            }
            return { url, base64 }
        }
    },
    {
        id: 'ai-vision',
        name: 'AI Vision',
        category: 'ai',
        description: 'Analyze images with AI vision models',
        icon: <Eye className="w-4 h-4" />,
        color: '#06b6d4',
        inputs: [
            { id: 'image', name: 'Image URL', type: 'string', required: true },
            { id: 'question', name: 'Question', type: 'string', required: true }
        ],
        outputs: [{ id: 'description', name: 'Description', type: 'string' }],
        params: [
            { name: 'provider', type: 'string', default: 'openai' },
            { name: 'model', type: 'string', default: 'gpt-4o' }
        ],
        isAsync: true,
        execute: async (inputs, params, state, context) => {
            const provider = context?.getProvider?.(params.provider as string)
            if (!provider?.apiKey) throw new Error(`Provider not configured`)

            const messages: Array<{ role: string; content: Array<{ type: string; text?: string; image_url?: { url: string }> }> = [{
                role: 'user',
                content: [
                    { type: 'text', text: String(inputs.question) },
                    { type: 'image_url', image_url: { url: String(inputs.image) } }
                ]
            ])

            const description = await callAI(provider, messages as unknown as Array<{ role: string; content: string }>, {
                model: params.model as string
            })
            return { description }
        }
    },
    {
        id: 'ai-embeddings',
        name: 'AI Embeddings',
        category: 'ai',
        description: 'Generate text embeddings for similarity search',
        icon: <Layers className="w-4 h-4" />,
        color: '#06b6d4',
        inputs: [{ id: 'text', name: 'Text', type: 'string', required: true }],
        outputs: [
            { id: 'embedding', name: 'Embedding', type: 'array' },
            { id: 'dimensions', name: 'Dimensions', type: 'number' }
        ],
        params: [
            { name: 'provider', type: 'string', default: 'openai' },
            { name: 'model', type: 'string', default: 'text-embedding-ada-002' }
        ],
        isAsync: true,
        execute: async (inputs, params, state, context) => {
            const provider = context?.getProvider?.(params.provider as string)
            if (!provider?.apiKey) throw new Error(`Provider not configured`)

            const embedding = await callAIEmbedding(provider, String(inputs.text), params.model as string)
            return { embedding, dimensions: embedding.length }
        }
    },
    {
        id: 'ai-summarizer',
        name: 'AI Summarizer',
        category: 'ai',
        description: 'Summarize long documents with AI',
        icon: <FileText className="w-4 h-4" />,
        color: '#06b6d4',
        inputs: [{ id: 'text', name: 'Text', type: 'string', required: true }],
        outputs: [{ id: 'summary', name: 'Summary', type: 'string' }],
        params: [
            { name: 'provider', type: 'string', default: 'openai' },
            { name: 'maxLength', type: 'number', default: 200 }
        ],
        isAsync: true,
        execute: async (inputs, params, state, context) => {
            const provider = context?.getProvider?.(params.provider as string)
            if (!provider?.apiKey) throw new Error(`Provider not configured`)

            const summary = await callAI(provider, [
                { role: 'system', content: `Summarize the following text in approximately ${(params.maxLength as number) || 200} words or less. Be concise and capture the key points.` },
                { role: 'user', content: String(inputs.text) }
            ], {})
            return { summary }
        }
    },
    {
        id: 'ai-translator',
        name: 'AI Translator',
        category: 'ai',
        description: 'Translate text between languages',
        icon: <Languages className="w-4 h-4" />,
        color: '#06b6d4',
        inputs: [{ id: 'text', name: 'Text', type: 'string', required: true }],
        outputs: [{ id: 'translated', name: 'Translated', type: 'string' }],
        params: [
            { name: 'provider', type: 'string', default: 'openai' },
            { name: 'sourceLang', type: 'string', default: 'auto' },
            { name: 'targetLang', type: 'string', default: 'English' }
        ],
        isAsync: true,
        execute: async (inputs, params, state, context) => {
            const provider = context?.getProvider?.(params.provider as string)
            if (!provider?.apiKey) throw new Error(`Provider not configured`)

            const translated = await callAI(provider, [
                { role: 'system', content: `Translate the following text to ${params.targetLang}. ${params.sourceLang !== 'auto' ? `The source language is ${params.sourceLang}.` : ''} Only output the translation, nothing else.` },
                { role: 'user', content: String(inputs.text) }
            ], {})
            return { translated }
        }
    },
    {
        id: 'ai-code-generator',
        name: 'AI Code Generator',
        category: 'ai',
        description: 'Generate code with AI',
        icon: <Code2 className="w-4 h-4" />,
        color: '#06b6d4',
        inputs: [{ id: 'description', name: 'Description', type: 'string', required: true }],
        outputs: [{ id: 'code', name: 'Code', type: 'string' }],
        params: [
            { name: 'provider', type: 'string', default: 'openai' },
            { name: 'language', type: 'string', default: 'JavaScript' }
        ],
        isAsync: true,
        execute: async (inputs, params, state, context) => {
            const provider = context?.getProvider?.(params.provider as string)
            if (!provider?.apiKey) throw new Error(`Provider not configured`)

            const code = await callAI(provider, [
                { role: 'system', content: `You are an expert programmer. Generate clean, efficient ${params.language} code based on the description. Only output the code, no explanations.` },
                { role: 'user', content: String(inputs.description) }
            ], {})
            return { code }
        }
    },
    {
        id: 'ai-json-extractor',
        name: 'AI JSON Extractor',
        category: 'ai',
        description: 'Extract structured JSON from unstructured text',
        icon: <Braces className="w-4 h-4" />,
        color: '#06b6d4',
        inputs: [
            { id: 'text', name: 'Text', type: 'string', required: true },
            { id: 'schema', name: 'Schema', type: 'string', required: false }
        ],
        outputs: [
            { id: 'json', name: 'JSON', type: 'object' },
            { id: 'valid', name: 'Valid', type: 'boolean' }
        ],
        params: [{ name: 'provider', type: 'string', default: 'openai' }],
        isAsync: true,
        execute: async (inputs, params, state, context) => {
            const provider = context?.getProvider?.(params.provider as string)
            if (!provider?.apiKey) throw new Error(`Provider not configured`)

            const schemaHint = inputs.schema ? `Use this schema: ${inputs.schema}` : ''
            const response = await callAI(provider, [
                { role: 'system', content: `Extract structured data as JSON from the given text. ${schemaHint} Only output valid JSON, no other text.` },
                { role: 'user', content: String(inputs.text) }
            ], {})

            try {
                const json = JSON.parse(response)
                return { json, valid: true }
            } catch {
                return { json: null, valid: false }
            }
        }
    },
    {
        id: 'ai-sentiment',
        name: 'AI Sentiment',
        category: 'ai',
        description: 'Analyze sentiment of text',
        icon: <Heart className="w-4 h-4" />,
        color: '#06b6d4',
        inputs: [{ id: 'text', name: 'Text', type: 'string', required: true }],
        outputs: [
            { id: 'sentiment', name: 'Sentiment', type: 'string' },
            { id: 'score', name: 'Score', type: 'number' }
        ],
        params: [{ name: 'provider', type: 'string', default: 'openai' }],
        isAsync: true,
        execute: async (inputs, params, state, context) => {
            const provider = context?.getProvider?.(params.provider as string)
            if (!provider?.apiKey) throw new Error(`Provider not configured`)

            const response = await callAI(provider, [
                { role: 'system', content: 'Analyze the sentiment of the text. Reply with only a JSON object: {"sentiment": "positive/negative/neutral", "score": 0.0-1.0}' },
                { role: 'user', content: String(inputs.text) }
            ], {})

            try {
                const parsed = JSON.parse(response)
                return { sentiment: parsed.sentiment || 'neutral', score: parsed.score || 0.5 }
            } catch {
                return { sentiment: 'neutral', score: 0.5 }
            }
        }
    },
    {
        id: 'ai-prompt-template',
        name: 'Prompt Template',
        category: 'ai',
        description: 'Create reusable prompt templates with variables',
        icon: <FileText className="w-4 h-4" />,
        color: '#06b6d4',
        inputs: [
            { id: 'variables', name: 'Variables', type: 'object', required: false, description: 'Template variables as JSON' }
        ],
        outputs: [{ id: 'prompt', name: 'Prompt', type: 'string' }],
        params: [
            { name: 'template', type: 'string', default: 'Hello {{name}}, please help with {{task}}', description: 'Template with {{variable}} placeholders' }
        ],
        execute: (inputs, params) => {
            let prompt = params.template as string || ''
            const vars = inputs.variables as Record<string, string> || {}
            Object.entries(vars).forEach(([key, value]) => {
                prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
            })
            return { prompt }
        }
    },
    {
        id: 'ai-chain',
        name: 'AI Chain',
        category: 'ai',
        description: 'Chain multiple AI prompts together',
        icon: <GitBranch className="w-4 h-4" />,
        color: '#06b6d4',
        inputs: [
            { id: 'input', name: 'Input', type: 'string', required: true },
            { id: 'previousOutput', name: 'Previous', type: 'string', required: false }
        ],
        outputs: [{ id: 'output', name: 'Output', type: 'string' }],
        params: [
            { name: 'provider', type: 'string', default: 'openai' },
            { name: 'promptTemplate', type: 'string', default: 'Given: {{input}}\\nPrevious: {{previous}}\\nContinue:' }
        ],
        isAsync: true,
        execute: async (inputs, params, state, context) => {
            const provider = context?.getProvider?.(params.provider as string)
            if (!provider?.apiKey) throw new Error(`Provider not configured`)

            let prompt = params.promptTemplate as string || ''
            prompt = prompt.replace('{{input}}', String(inputs.input))
            prompt = prompt.replace('{{previous}}', String(inputs.previousOutput || ''))

            const output = await callAI(provider, [{ role: 'user', content: prompt }], {})
            return { output }
        }
    },
    {
        id: 'ai-memory',
        name: 'AI Memory',
        category: 'ai',
        description: 'Store and retrieve conversation context',
        icon: <Brain className="w-4 h-4" />,
        color: '#06b6d4',
        inputs: [
            { id: 'message', name: 'Message', type: 'string', required: false },
            { id: 'role', name: 'Role', type: 'string', required: false }
        ],
        outputs: [{ id: 'history', name: 'History', type: 'array' }],
        params: [{ name: 'maxMessages', type: 'number', default: 10 }],
        execute: (inputs, params, state) => {
            const history = (state?.history as Array<{ role: string; content: string }>) || []
            if (inputs.message && inputs.role) {
                history.push({ role: String(inputs.role), content: String(inputs.message) })
                while (history.length > ((params.maxMessages as number) || 10)) history.shift()
            }
            return { history, _state: { history } }
        }
    },

    // ==================== WORKFLOW CHIPS ====================
    {
        id: 'workflow-trigger',
        name: 'Workflow Trigger',
        category: 'workflow',
        description: 'Trigger workflow execution',
        icon: <Play className="w-4 h-4" />,
        color: '#f97316',
        inputs: [],
        outputs: [{ id: 'trigger', name: 'Trigger', type: 'boolean' }],
        params: [{ name: 'type', type: 'string', default: 'manual', description: 'manual, webhook, schedule' }],
        execute: () => ({ trigger: true })
    },
    {
        id: 'http-request',
        name: 'HTTP Request',
        category: 'connector',
        description: 'Make HTTP/HTTPS requests',
        icon: <Globe className="w-4 h-4" />,
        color: '#0ea5e9',
        inputs: [
            { id: 'body', name: 'Body', type: 'object', required: false },
            { id: 'headers', name: 'Headers', type: 'object', required: false }
        ],
        outputs: [
            { id: 'response', name: 'Response', type: 'object' },
            { id: 'status', name: 'Status', type: 'number' }
        ],
        params: [
            { name: 'url', type: 'string', default: '', description: 'Request URL' },
            { name: 'method', type: 'string', default: 'GET', description: 'HTTP method' }
        ],
        isAsync: true,
        execute: async (inputs, params) => {
            try {
                const response = await fetch(params.url as string, {
                    method: params.method as string || 'GET',
                    headers: inputs.headers as Record<string, string> || {},
                    body: inputs.body ? JSON.stringify(inputs.body) : undefined
                })
                const data = await response.json()
                return { response: data, status: response.status }
            } catch (error) {
                return { response: { error: String(error) }, status: 0 }
            }
        }
    },
    {
        id: 'webhook-receiver',
        name: 'Webhook Receiver',
        category: 'connector',
        description: 'Receive webhook data',
        icon: <Webhook className="w-4 h-4" />,
        color: '#0ea5e9',
        inputs: [],
        outputs: [
            { id: 'data', name: 'Data', type: 'object' },
            { id: 'headers', name: 'Headers', type: 'object' }
        ],
        params: [{ name: 'path', type: 'string', default: '/webhook', description: 'Webhook path' }],
        execute: (inputs, params) => ({ data: {}, headers: {} })
    },
    {
        id: 'loop',
        name: 'Loop',
        category: 'workflow',
        description: 'Iterate over array items',
        icon: <Repeat className="w-4 h-4" />,
        color: '#f97316',
        inputs: [{ id: 'array', name: 'Array', type: 'array', required: true }],
        outputs: [
            { id: 'item', name: 'Item', type: 'any' },
            { id: 'index', name: 'Index', type: 'number' }
        ],
        params: [],
        execute: (inputs, params, state) => {
            const arr = inputs.array as unknown[] || []
            const idx = (state?.index as number) || 0
            if (idx < arr.length) {
                return { item: arr[idx], index: idx, _state: { index: idx + 1 } }
            }
            return { item: null, index: -1 }
        }
    },
    {
        id: 'merge',
        name: 'Merge',
        category: 'workflow',
        description: 'Merge multiple inputs',
        icon: <Merge className="w-4 h-4" />,
        color: '#f97316',
        inputs: [
            { id: 'a', name: 'A', type: 'any', required: false },
            { id: 'b', name: 'B', type: 'any', required: false },
            { id: 'c', name: 'C', type: 'any', required: false }
        ],
        outputs: [{ id: 'merged', name: 'Merged', type: 'object' }],
        execute: (inputs) => ({ merged: inputs })
    },
    {
        id: 'delay',
        name: 'Delay',
        category: 'workflow',
        description: 'Delay execution',
        icon: <Clock className="w-4 h-4" />,
        color: '#f97316',
        inputs: [{ id: 'passthrough', name: 'In', type: 'any', required: false }],
        outputs: [{ id: 'passthrough', name: 'Out', type: 'any' }],
        params: [{ name: 'ms', type: 'number', default: 1000, description: 'Delay in milliseconds' }],
        isAsync: true,
        execute: async (inputs, params) => {
            await new Promise(r => setTimeout(r, (params.ms as number) || 1000))
            return { passthrough: inputs.passthrough }
        }
    },
    {
        id: 'condition',
        name: 'Condition',
        category: 'workflow',
        description: 'Conditional branching',
        icon: <GitBranch className="w-4 h-4" />,
        color: '#f97316',
        inputs: [
            { id: 'value', name: 'Value', type: 'any', required: true },
            { id: 'compare', name: 'Compare', type: 'any', required: false }
        ],
        outputs: [
            { id: 'true', name: 'True', type: 'any' },
            { id: 'false', name: 'False', type: 'any' }
        ],
        params: [{ name: 'operator', type: 'string', default: 'equals', description: 'equals, notEquals, greater, less, contains' }],
        execute: (inputs, params) => {
            const val = inputs.value
            const cmp = inputs.compare
            let result = false
            switch (params.operator) {
                case 'equals': result = val === cmp; break
                case 'notEquals': result = val !== cmp; break
                case 'greater': result = Number(val) > Number(cmp); break
                case 'less': result = Number(val) < Number(cmp); break
                case 'contains': result = String(val).includes(String(cmp)); break
            }
            return { true: result ? val : null, false: result ? null : val }
        }
    },

    // ==================== SIGNAL PROCESSING CHIPS ====================
    {
        id: 'fft',
        name: 'FFT',
        category: 'signal',
        description: 'Fast Fourier Transform',
        icon: <Signal className="w-4 h-4" />,
        color: '#10b981',
        inputs: [{ id: 'signal', name: 'Signal', type: 'array', required: true }],
        outputs: [
            { id: 'magnitude', name: 'Magnitude', type: 'array' },
            { id: 'phase', name: 'Phase', type: 'array' },
            { id: 'frequencies', name: 'Frequencies', type: 'array' }
        ],
        params: [{ name: 'sampleRate', type: 'number', default: 44100 }],
        execute: (inputs, params) => {
            const signal = inputs.signal as number[] || []
            const n = signal.length
            if (n === 0) return { magnitude: [], phase: [], frequencies: [] }
            const magnitude: number[] = [], phase: number[] = [], frequencies: number[] = []
            const sr = (params.sampleRate as number) || 44100
            for (let k = 0; k < Math.floor(n / 2); k++) {
                let real = 0, imag = 0
                for (let j = 0; j < n; j++) {
                    const angle = (2 * Math.PI * k * j) / n
                    real += signal[j] * Math.cos(angle)
                    imag -= signal[j] * Math.sin(angle)
                }
                magnitude.push(Math.sqrt(real * real + imag * imag) / n)
                phase.push(Math.atan2(imag, real))
                frequencies.push((k * sr) / n)
            }
            return { magnitude, phase, frequencies }
        }
    },
    {
        id: 'fir-filter',
        name: 'FIR Filter',
        category: 'signal',
        description: 'FIR filter (lowpass/highpass)',
        icon: <Filter className="w-4 h-4" />,
        color: '#10b981',
        inputs: [{ id: 'signal', name: 'Signal', type: 'array', required: true }],
        outputs: [{ id: 'filtered', name: 'Filtered', type: 'array' }],
        params: [
            { name: 'type', type: 'string', default: 'lowpass' },
            { name: 'cutoff', type: 'number', default: 0.3 },
            { name: 'taps', type: 'number', default: 32 }
        ],
        execute: (inputs, params) => {
            const signal = inputs.signal as number[] || []
            const type = params.type as string || 'lowpass'
            const taps = params.taps as number || 32
            const cutoff = params.cutoff as number || 0.3
            const coeffs: number[] = []
            const M = taps - 1
            for (let n = 0; n < taps; n++) {
                let h = n === m / 2 ? 2 * cutoff : Math.sin(2 * Math.PI * cutoff * (n - m / 2)) / (Math.PI * (n - m / 2))
                h *= 0.54 - 0.46 * Math.cos((2 * Math.PI * n) / m)
                coeffs.push(type === 'highpass' ? (n === m / 2 ? 1 - h : -h) : h)
            }
            const filtered: number[] = []
            for (let i = 0; i < signal.length; i++) {
                let sum = 0
                for (let j = 0; j < taps && i - j >= 0; j++) {
                    sum += signal[i - j] * coeffs[j]
                }
                filtered.push(sum)
            }
            return { filtered }
        }
    },
    {
        id: 'signal-generator',
        name: 'Signal Generator',
        category: 'signal',
        description: 'Generate waveforms',
        icon: <Zap className="w-4 h-4" />,
        color: '#10b981',
        inputs: [],
        outputs: [{ id: 'signal', name: 'Signal', type: 'array' }],
        params: [
            { name: 'type', type: 'string', default: 'sine' },
            { name: 'frequency', type: 'number', default: 5 },
            { name: 'amplitude', type: 'number', default: 1 },
            { name: 'samples', type: 'number', default: 1000 },
            { name: 'sampleRate', type: 'number', default: 44100 }
        ],
        execute: (inputs, params) => {
            const type = params.type as string || 'sine'
            const freq = params.frequency as number || 5
            const amp = params.amplitude as number || 1
            const samples = params.samples as number || 1000
            const sr = params.sampleRate as number || 44100
            const signal: number[] = []
            for (let i = 0; i < samples; i++) {
                const t = i / sr
                let value = 0
                switch (type) {
                    case 'sine':
                        value = amp * Math.sin(2 * Math.PI * freq * t)
                        break
                    case 'square':
                        value = amp * (Math.sin(2 * Math.PI * freq * t) >= 0 ? 1 : -1)
                        break
                    case 'sawtooth':
                        value = amp * (2 * ((freq * t) % 1) - 1)
                        break
                    case 'noise':
                        value = amp * (Math.random() * 2 - 1)
                        break
                }
                signal.push(value)
            }
            return { signal }
        }
    },

    // ==================== COMMunication CHIPS ====================
    {
        id: 'uart-encoder',
        name: 'UART Encode',
        category: 'communication',
        description: 'encode data as UART frames',
        icon: <Cable className="w-4 h-4" />,
        color: '#3b82f6',
        inputs: [{ id: 'data', name: 'Data', type: 'string', required: true }],
        outputs: [
            { id: 'frames', name: 'Frames', type: 'array' },
            { id: 'hex', name: 'Hex', type: 'string' }
        ],
        params: [{ name: 'baudRate', type: 'number', default: 9600 }],
        execute: (inputs, params) => {
            const data = String(inputs.data || '')
            const frames: unknown[] = []
            const hexParts: string[] = []
            const bytes: number[] = []
            for (const char of data) {
                const code = char.charCodeAt(0)
                bytes.push(code)
                const bits: number[] = []
                for (let i = 0; i < 8; i++) {
                    bits.push((code >> i) & 1)
                }
                frames.push({ startBit: 0, dataBits: bits, stopBit: 1, char })
                hexParts.push(code.toString(16).padStart(2, '0').toUpperCase())
            }
            return { frames, hex: hexParts.join(' ') }
        }
    },
    {
        id: 'uart-decoder',
        name: 'UART Decode',
        category: 'communication',
        description: 'decode UART hex to text',
        icon: <Cable className="w-4 h-4" />,
        color: '#3b82f6',
        inputs: [
            { id: 'hex', name: 'Hex', type: 'string', required: false },
            { id: 'bytes', name: 'Bytes', type: 'array', required: false }
        ],
        outputs: [
            { id: 'text', name: 'Text', type: 'string' },
            { id: 'bytes', name: 'Bytes', type: 'array' }
        ],
        params: [],
        execute: (inputs) => {
            let bytes: number[] = []
            if (inputs.hex) {
                const hex = String(inputs.hex).replace(/\s+/g, '')
                for (let i = 0; i < hex.length; i += 2) {
                    bytes.push(parseInt(hex.substr(i, 2), 16))
                }
            } else if (inputs.bytes && Array.isArray(inputs.bytes)) {
                bytes = inputs.bytes as number[]
            }
            const text = bytes.map(b => String.fromCharCode(b)).join('')
            return { text, bytes }
        }
    },
    {
        id: 'modbus-rtu',
        name: 'Modbus RTU',
        category: 'communication',
        description: 'generate Modbus RTU frame',
        icon: <Grid3X3 className="w-4 h-4" />,
        color: '#3b82f6',
        inputs: [],
        outputs: [
            { id: 'frame', name: 'Frame', type: 'object' },
            { id: 'hex', name: 'Hex', type: 'string' }
        ],
        params: [
            { name: 'slaveId', type: 'number', default: 1 },
            { name: 'function', type: 'string', default: '03' },
            { name: 'register', type: 'number', default: 0 },
            { name: 'count', type: 'number', default: 1 }
        ],
        execute: (inputs, params) => {
            const slaveId = params.slaveId as number || 1
            const funcCode = parseInt(params.function as string || '03', 16)
            const register = params.register as number || 0
            const count = params.count as number || 1
            const frame = [
                slaveId,
                funcCode,
                (register >> 8) & 0xff,
                register & 0xff,
                (count >> 8) & 0xff,
                count & 0xff
            ]
            let crc = 0xffff
            for (const byte of frame) {
                crc ^= byte
                for (let i = 0; i < 8; i++) {
                    crc = (crc & 0x0001) ? ((crc >> 1) ^ 0xa001) : (crc >> 1)
                }
            }
            frame.push(crc & 0xff, (crc >> 8) & 0xff)
            return {
                frame: { bytes: frame, slaveId, function: funcCode, register, count },
                hex: frame.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
            }
        }
    },

    // ==================== LOGic chips ====================
    {
        id: 'logic-and',
        name: 'AND',
        category: 'logic',
        description: 'Logical AND gate',
        icon: <Cpu className="w-4 h-4" />,
        color: '#f59e0b',
        inputs: [
            { id: 'a', name: 'A', type: 'boolean', required: true },
            { id: 'b', name: 'B', type: 'boolean', required: true }
        ],
        outputs: [{ id: 'out', name: 'Out', type: 'boolean' }],
        execute: (inputs) => ({ out: Boolean(inputs.a) && Boolean(inputs.b) })
    },
    {
        id: 'logic-or',
        name: 'OR',
        category: 'logic',
        description: 'Logical OR gate',
        icon: <Cpu className="w-4 h-4" />,
        color: '#f59e0b',
        inputs: [
            { id: 'a', name: 'A', type: 'boolean', required: true },
            { id: 'b', name: 'B', type: 'boolean', required: true }
        ],
        outputs: [{ id: 'out', name: 'Out', type: 'boolean' }],
        execute: (inputs) => ({ out: Boolean(inputs.a) || Boolean(inputs.b) })
    },
    {
        id: 'logic-not',
        name: 'NOT',
        category: 'logic',
        description: 'Logical NOT gate',
        icon: <Cpu className="w-4 h-4" />,
        color: '#f59e0b',
        inputs: [{ id: 'in', name: 'In', type: 'boolean', required: true }],
        outputs: [{ id: 'out', name: 'Out', type: 'boolean' }],
        execute: (inputs) => ({ out: !Boolean(inputs.in) })
    },
    {
        id: 'comparator',
        name: 'Comparator',
        category: 'logic',
        description: 'compare two values',
        icon: <Target className="w-4 h-4" />,
        color: '#f59e0b',
        inputs: [
            { id: 'a', name: 'A', type: 'number', required: true },
            { id: 'b', name: 'B', type: 'number', required: true }
        ],
        outputs: [
            { id: 'equal', name: 'A = B', type: 'boolean' },
            { id: 'greater', name: 'A > B', type: 'boolean' },
            { id: 'less', name: 'A < B', type: 'boolean' }
        ],
        params: [],
        execute: (inputs) => ({
            equal: inputs.a === inputs.b,
            greater: Number(inputs.a) > Number(inputs.b),
            less: Number(inputs.a) < Number(inputs.b)
        })
    },

    // ==================== math chips ====================
    {
        id: 'calculator',
        name: 'Calculator',
        category: 'math',
        description: 'Basic arithmetic',
        icon: <Calculator className="w-4 h-4" />,
        color: '#ec4899',
        inputs: [
            { id: 'a', name: 'A', type: 'number', required: true },
            { id: 'b', name: 'B', type: 'number', required: false }
        ],
        outputs: [{ id: 'result', name: 'Result', type: 'number' }],
        params: [{ name: 'operation', type: 'string', default: 'add' }],
        execute: (inputs, params) => {
            const a = Number(inputs.a) || 0, b = Number(inputs.b) || 0
            const ops: Record<string, number> = { add: a + b, sub: a - b, mul: a * b, div: b ? a / b : 0, pow: Math.pow(a, b), sqrt: Math.sqrt(a), abs: Math.abs(a) }
            return { result: ops[params.operation as string] || 0 }
        }
    },
    {
        id: 'statistics',
        name: 'Statistics',
        category: 'math',
        description: 'Statistical analysis',
        icon: <BarChart3 className="w-4 h-4" />,
        color: '#ec4899',
        inputs: [{ id: 'data', name: 'Data', type: 'array', required: true }],
        outputs: [
            { id: 'mean', name: 'Mean', type: 'number' },
            { id: 'median', name: 'Median', type: 'number' },
            { id: 'stdDev', name: 'StdDev', type: 'number' },
            { id: 'min', name: 'Min', type: 'number' },
            { id: 'max', name: 'Max', type: 'number' }
        ],
        params: [],
        execute: (inputs) => {
            const data = (inputs.data as number[]) || []
            if (data.length === 0) return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 }
            const sorted = [...data].sort((a, b) => a - b)
            const mean = data.reduce((a, b) => a + b, 0) / data.length
            const median = data.length % 2 === 0
                ? (sorted[data.length / 2 - 1] + sorted[data.length / 2]) / 2
                : sorted[Math.floor(data.length / 2)]
            const variance = data.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / data.length
            return { mean, median, stdDev: Math.sqrt(variance), min: sorted[0], max: sorted[sorted.length - 1] }
        }
    },
    {
        id: 'pid-controller',
        name: 'PID Controller',
        category: 'math',
        description: 'PID control algorithm',
        icon: <Target className="w-4 h-4" />,
        color: '#ec4899',
        inputs: [
            { id: 'setpoint', name: 'Setpoint', type: 'number', required: true },
            { id: 'processValue', name: 'PV', type: 'number', required: true }
        ],
        outputs: [
            { id: 'output', name: 'Output', type: 'number' },
            { id: 'error', name: 'Error', type: 'number' }
        ],
        params: [
            { name: 'kp', type: 'number', default: 1 },
            { name: 'ki', type: 'number', default: 0.1 },
            { name: 'kd', type: 'number', default: 0.01 }
        ],
        execute: (inputs, params, state) => {
            const setpoint = Number(inputs.setpoint) || 0
            const pv = Number(inputs.processValue) || 0
            const kp = Number(params.kp) || 1
            const ki = Number(params.ki) || 0.1
            const kd = Number(params.kd) || 0.01
            const prevError = (state?.prevError as number) || 0
            const integral = (state?.integral as number) || 0
            const error = setpoint - pv
            const newIntegral = integral + error
            const derivative = error - prevError
            const output = kp * error + ki * newIntegral + kd * derivative
            return { output, error, _state: { prevError: error, integral: newIntegral } }
        }
    },

    // ==================== data chips ====================
    {
        id: 'json-parser',
        name: 'JSON Parser',
        category: 'data',
        description: 'Parse/stringify JSON',
        icon: <FileJson className="w-4 h-4" />,
        color: '#8b5cf6',
        inputs: [
            { id: 'data', name: 'Data', type: 'string', required: false },
            { id: 'object', name: 'Object', type: 'object', required: false }
        ],
        outputs: [
            { id: 'parsed', name: 'Parsed', type: 'object' },
            { id: 'string', name: 'String', type: 'string' },
            { id: 'valid', name: 'Valid', type: 'boolean' }
        ],
        params: [{ name: 'mode', type: 'string', default: 'parse' }],
        execute: (inputs, params) => {
            const mode = params.mode as string || 'parse'
            let parsed: unknown = null
            let string = ''
            let valid = false
            try {
                if (mode === 'parse' && inputs.data) {
                    parsed = JSON.parse(String(inputs.data))
                    string = String(inputs.data)
                    valid = true
                } else if (mode === 'stringify' && inputs.object) {
                    parsed = inputs.object
                    string = JSON.stringify(inputs.object, null, 2)
                    valid = true
                }
            } catch {
                valid = false
            }
            return { parsed, string, valid }
        }
    },
    {
        id: 'base64',
        name: 'Base64',
        category: 'data',
        description: 'Base64 encode/decode',
        icon: <Code className="w-4 h-4" />,
        color: '#8b5cf6',
        inputs: [{ id: 'data', name: 'Data', type: 'string', required: true }],
        outputs: [
            { id: 'encoded', name: 'Encoded', type: 'string' },
            { id: 'decoded', name: 'Decoded', type: 'string' }
        ],
        params: [{ name: 'mode', type: 'string', default: 'encode' },
        execute: (inputs, params) => {
            const data = String(inputs.data || '')
            if (params.mode === 'encode') {
                return { encoded: btoa(data), decoded: data }
            }
            try {
                return { encoded: data, decoded: atob(data) }
            } catch {
                return { encoded: data, decoded: '' }
            }
        }
    },
    {
        id: 'hash',
        name: 'Hash',
        category: 'security',
        description: 'Generate hash (SHA-256)',
        icon: <Shield className="w-4 h-4" />,
        color: '#ef4444',
        inputs: [{ id: 'data', name: 'Data', type: 'string', required: true }],
        outputs: [{ id: 'hash', name: 'Hash', type: 'string' }],
        isAsync: true,
        execute: async (inputs) => {
            const encoder = new TextEncoder()
            const data = encoder.encode(String(inputs.data || ''))
            const hashBuffer = await crypto.subtle.digest('SHA-256', data)
            const hashArray = Array.from(new Uint8Array(hashBuffer))
            return { hash: hashArray.map(b => b.toString(16).padStart(2, '0')).join('') }
        }
    }
]

// ============================================================================
// templates
// ============================================================================

const TEMPLATES = [
    {
        id: 'ai-chatbot',
        name: 'AI Chatbot Pipeline',
        description: 'Build a conversational AI with memory',
        icon: <Bot className="w-5 h-5" />,
        chips: [
            { chipId: 'text-input', position: { x: 100, y: 100 }, params: { value: 'Hello, how are you?' } },
            { chipId: 'ai-memory', position: { x: 350, y: 50 }, params: {} },
            { chipId: 'ai-chat', position: { x: 600, y: 100 }, params: { provider: 'openai', model: 'gpt-4o-mini' } },
            { chipId: 'value-display', position: { x: 850, y: 100 }, params: { label: 'AI Response' } }
        ],
        connections: [
            { fromChip: 'text-input-0', fromPin: 'value', toChip: 'ai-chat-0', toPin: 'message' },
            { fromChip: 'ai-memory-0', fromPin: 'history', toChip: 'ai-chat-0', toPin: 'history' },
            { fromChip: 'ai-chat-0', fromPin: 'response', toChip: 'value-display-0', toPin: 'value' }
        ]
    },
    {
        id: 'audio-analyzer',
        name: 'Audio Spectrum Analyzer',
        description: 'Analyze audio frequencies',
        icon: <AudioWaveform className="w-5 h-5" />,
        chips: [
            { chipId: 'audio-file-input', position: { x: 100, y: 150 }, params: {} },
            { chipId: 'fft', position: { x: 350, y: 150 }, params: { sampleRate: 44100 } },
            { chipId: 'spectrum-display', position: { x: 600, y: 150 }, params: {} },
            { chipId: 'waveform-display', position: { x: 600, y: 300 }, params: {} }
        ],
        connections: [
            { fromChip: 'audio-file-input-0', fromPin: 'samples', toChip: 'fft-0', toPin: 'signal' },
            { fromChip: 'fft-0', fromPin: 'magnitude', toChip: 'spectrum-display-0', toPin: 'magnitude' },
            { fromChip: 'audio-file-input-0', fromPin: 'samples', toChip: 'waveform-display-0', toPin: 'signal' }
        ]
    },
    {
        id: 'ai-translator',
        name: 'Multi-Language Translator',
        description: 'translate text to any language',
        icon: <Languages className="w-5 h-5" />,
        chips: [
            { chipId: 'text-input', position: { x: 100, y: 150 }, params: { value: 'Hello, world!' } },
            { chipId: 'ai-translator', position: { x: 350, y: 150 }, params: { provider: 'openai', targetLang: 'Spanish' } },
            { chipId: 'value-display', position: { x: 600, y: 150 }, params: { label: 'Translation' } }
        ],
        connections: [
            { fromChip: 'text-input-0', fromPin: 'value', toChip: 'ai-translator-0', toPin: 'text' },
            { fromChip: 'ai-translator-0', fromPin: 'translated', toChip: 'value-display-0', toPin: 'value' }
        ]
    },
    {
        id: 'ai-summarizer',
        name: 'Document Summarizer',
        description: 'Summarize long documents with AI',
        icon: <FileText className="w-5 h-5" />,
        chips: [
            { chipId: 'text-input', position: { x: 100, y: 150 }, params: { value: 'Paste your long text here...' } },
            { chipId: 'ai-summarizer', position: { x: 350, y: 150 }, params: { provider: 'openai', maxLength: 200 } },
            { chipId: 'value-display', position: { x: 600, y: 150 }, params: { label: 'Summary' } }
        ],
        connections: [
            { fromChip: 'text-input-0', fromPin: 'value', toChip: 'ai-summarizer-0', toPin: 'text' },
            { fromChip: 'ai-summarizer-0', fromPin: 'summary', toChip: 'value-display-0', toPin: 'value' }
        ]
    },
    {
        id: 'ai-image-gen',
        name: 'AI Image Generator',
        description: 'Generate images from text prompts',
        icon: <ImageIcon className="w-5 h-5" />,
        chips: [
            { chipId: 'text-input', position: { x: 100, y: 150 }, params: { value: 'A beautiful sunset over mountains' } },
            { chipId: 'ai-image-generator', position: { x: 350, y: 150 }, params: { provider: 'openai', size: '1024x1024' } },
            { chipId: 'image-display', position: { x: 600, y: 150 }, params: {} }
        ],
        connections: [
            { fromChip: 'text-input-0', fromPin: 'value', toChip: 'ai-image-generator-0', toPin: 'prompt' },
            { fromChip: 'ai-image-generator-0', fromPin: 'url', toChip: 'image-display-0', toPin: 'url' }
        ]
    },
    {
        id: 'ai-code-gen',
        name: 'AI Code Generator',
        description: 'Generate code from descriptions',
        icon: <Code2 className="w-5 h-5" />,
        chips: [
            { chipId: 'text-input', position: { x: 100, y: 150 }, params: { value: 'Write a function to calculate fibonacci numbers' } },
            { chipId: 'ai-code-generator', position: { x: 350, y: 150 }, params: { provider: 'openai', language: 'Python' } },
            { chipId: 'value-display', position: { x: 600, y: 150 }, params: { label: 'Generated Code' } }
        ],
        connections: [
            { fromChip: 'text-input-0', fromPin: 'value', toChip: 'ai-code-generator-0', toPin: 'description' },
            { fromChip: 'ai-code-generator-0', fromPin: 'code', toChip: 'value-display-0', toPin: 'value' }
        ]
    },
    {
        id: 'sentiment-analysis',
        name: 'Sentiment Analysis',
        description: 'Analyze sentiment of text',
        icon: <Heart className="w-5 h-5" />,
        chips: [
            { chipId: 'text-input', position: { x: 100, y: 150 }, params: { value: 'I love this product!' } },
            { chipId: 'ai-sentiment', position: { x: 350, y: 150 }, params: { provider: 'openai' } },
            { chipId: 'value-display', position: { x: 600, y: 100 }, params: { label: 'Sentiment' } },
            { chipId: 'value-display', position: { x: 600, y: 200 }, params: { label: 'Score' } }
        ],
        connections: [
            { fromChip: 'text-input-0', fromPin: 'value', toChip: 'ai-sentiment-0', toPin: 'text' },
            { fromChip: 'ai-sentiment-0', fromPin: 'sentiment', toChip: 'value-display-0', toPin: 'value' },
            { fromChip: 'ai-sentiment-0', fromPin: 'score', toChip: 'value-display-1', toPin: 'value' }
        ]
    },
    {
        id: 'signal-filter',
        name: 'Signal Filter Pipeline',
        description: 'Filter and analyze signals',
        icon: <Filter className="w-5 h-5" />,
        chips: [
            { chipId: 'signal-generator', position: { x: 100, y: 150 }, params: { type: 'sine', frequency: 10 } },
            { chipId: 'fir-filter', position: { x: 350, y: 150 }, params: { type: 'lowpass', cutoff: 0.2 } },
            { chipId: 'waveform-display', position: { x: 600, y: 100 }, params: {} },
            { chipId: 'fft', position: { x: 600, y: 250 }, params: {} },
            { chipId: 'spectrum-display', position: { x: 850, y: 250 }, params: {} }
        ],
        connections: [
            { fromChip: 'signal-generator-0', fromPin: 'signal', toChip: 'fir-filter-0', toPin: 'signal' },
            { fromChip: 'fir-filter-0', fromPin: 'filtered', toChip: 'waveform-display-0', toPin: 'signal' },
            { fromChip: 'fir-filter-0', fromPin: 'filtered', toChip: 'fft-0', toPin: 'signal' },
            { fromChip: 'fft-0', fromPin: 'magnitude', toChip: 'spectrum-display-0', toPin: 'magnitude' }
        ]
    },
    {
        id: 'http-workflow',
        name: 'HTTP API Workflow',
        description: 'Fetch and process API data',
        icon: <Globe className="w-5 h-5" />,
        chips: [
            { chipId: 'workflow-trigger', position: { x: 100, y: 150 }, params: { type: 'manual' } },
            { chipId: 'http-request', position: { x: 350, y: 150 }, params: { url: 'https://api.example.com/data', method: 'GET' } },
            { chipId: 'json-parser', position: { x: 600, y: 150 }, params: { mode: 'parse' } },
            { chipId: 'data-table', position: { x: 850, y: 150 }, params: {} }
        ],
        connections: [
            { fromChip: 'workflow-trigger-0', fromPin: 'trigger', toChip: 'http-request-0', toPin: 'headers' },
            { fromChip: 'http-request-0', fromPin: 'response', toChip: 'json-parser-0', toPin: 'data' },
            { fromChip: 'json-parser-0', fromPin: 'parsed', toChip: 'data-table-0', toPin: 'data' }
        ]
    },
    {
        id: 'ai-chain-workflow',
        name: 'AI Chain Workflow',
        description: 'Chain multiple AI operations',
        icon: <GitBranch className="w-5 h-5" />,
        chips: [
            { chipId: 'text-input', position: { x: 100, y: 150 }, params: { value: 'Write a story about a robot' } },
            { chipId: 'ai-text-generator', position: { x: 350, y: 100 }, params: { provider: 'openai' } },
            { chipId: 'ai-summarizer', position: { x: 600, y: 100 }, params: { provider: 'openai' } },
            { chipId: 'ai-translator', position: { x: 850, y: 100 }, params: { provider: 'openai', targetLang: 'French' } },
            { chipId: 'value-display', position: { x: 1100, y: 100 }, params: { label: 'Final Output' } }
        ],
        connections: [
            { fromChip: 'text-input-0', fromPin: 'value', toChip: 'ai-text-generator-0', toPin: 'prompt' },
            { fromChip: 'ai-text-generator-0', fromPin: 'text', toChip: 'ai-summarizer-0', toPin: 'text' },
            { fromChip: 'ai-summarizer-0', fromPin: 'summary', toChip: 'ai-translator-0', toPin: 'text' },
            { fromChip: 'ai-translator-0', fromPin: 'translated', toChip: 'value-display-0', toPin: 'value' }
        ]
    }
]

// ============================================================================
// main application
// ============================================================================

export default function SoftChipStudio() {
    const [currentPage, setCurrentPage] = useState<View>('home' | 'builder' | 'tutorials'>('home')
    const [menuOpen, setMenuOpen] = useState(false)
    const [circuit, setCircuit] = useState<Circuit>({ chips: [], connections: [] })
    const [selectedChip, setSelectedChip] = useState<string | null>(null)
    const [connectingFrom, setConnectingFrom] = useState<{ chipId: string; pinId: string; isOutput: boolean } | null>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [aiProviders, setAiProviders] = useState<AIProviders>(DEFAULT_providers)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const canvasRef = useRef<HTMLDivElement>(null)
    const [executionLogs, setExecutionLogs] = useState<string[]>([])

    // load AI providers on mount
    useEffect(() => {
        setAiProviders(loadProviders())
    }, [])
    // save providers when changed
    const updateProvider = (key: keyof AIProviders, updates: Partial<AIProvider>) => {
        const newProviders = { ...aiProviders, [key]: { ...aiProviders[key], ...updates } }
        setAiProviders(newProviders)
        saveProviders(newProviders)
        toast.success(`${aiProviders[key].name} configuration saved`)
    }
    const getProvider = useCallback((name: string) => {
        return aiProviders[name as keyof AIProviders] || null
    }, [aiProviders])
    const aiContext: AIContext = { providers: aiProviders, getProvider }
    // Get chip definition
    const getChipDef = (chipId: string) => CHIP_LIBRARY.find(c => c.id === chipId)
    // Place new chip
    const placeChip = (chipId: string) => {
        const def = getChipDef(chipId)
        if (!def) return
        const newChip: PlacedChip = {
            instanceId: `${chipId}-${Date.now()}`,
            chipId,
            position: { x: 200 + Math.random() * 200, y: 150 + Math.random() * 100 },
            params: def.params?.reduce((acc, p) => ({ ...acc, [p.name]: p.default }), {}) || {},
            inputValues: {},
            outputValues: {}
        }
        setCircuit(prev => ({ ...prev, chips: [...prev.chips, newChip] }))
        toast.success(`Added ${def.name}`)
    }
    // Load template
    const loadTemplate = (templateId: string) => {
        const template = TEMPLATES.find(t => t.id === templateId)
        if (!template) return
        const chips: PlacedChip[] = template.chips.map((tChip, idx) => ({
            instanceId: `${tChip.chipId}-${idx}`,
            chipId: tChip.chipId,
            position: tChip.position,
            params: tChip.params,
            inputValues: {},
            outputValues: {}
        }))
        const connections: Connection[] = template.connections.map((conn, idx) => ({
            id: `conn-${idx}`,
            fromChip: conn.fromChip,
            fromPin: conn.fromPin,
            toChip: conn.toChip,
            toPin: conn.toPin
        }))
        setCircuit({ chips, connections })
        setCurrentPage('builder')
        toast.success(`Loaded template: ${template.name}`)
    }
    // Handle pin click for connection
    const handlePinClick = (chipId: string, pinId: string, isOutput: boolean) => {
        if (connectingFrom) {
            if (connectingFrom.isOutput !== isOutput && connectingFrom.chipId !== chipId) {
                const newConn: Connection = {
                    id: `conn-${Date.now()}`,
                    fromChip: connectingFrom.isOutput ? connectingFrom.chipId : chipId,
                    fromPin: connectingFrom.isOutput ? connectingFrom.pinId : pinId,
                    toChip: connectingFrom.isOutput ? chipId : connectingFrom.chipId,
                    toPin: connectingFrom.isOutput ? pinId : connectingFrom.pinId
                }
                setCircuit(prev => ({ ...prev, connections: [...prev.connections.filter(c => !(c.toChip === newConn.toChip && c.toPin === newConn.toPin)), newConn] }))
                toast.success('Connection created')
            }
            setConnectingFrom(null)
        } else {
            setConnectingFrom({ chipId, pinId, isOutput })
        }
    }
    // Run circuit
    const runCircuit = async () => {
        if (isRunning) return
        setIsRunning(true)
        setExecutionLogs(['Starting execution...'])
        const executionStates: Record<string, unknown> = {}
        const executed = new Set<string>()
        const executeChip = async (chip: PlacedChip): Promise<void> => {
            if (executed.has(chip.instanceId)) return
            const def = getChipDef(chip.chipId)
            if (!def) return
            // Execute dependencies first
            const dependencies = circuit.connections
                .filter(c => c.toChip === chip.instanceId)
                .map(c => circuit.chips.find(ch => ch.instanceId === c.fromChip))
                .filter(Boolean) as PlacedChip[]
            for (const dep of dependencies) {
                await executeChip(dep)
            }
            // Gather inputs
            const inputs: Record<string, unknown> = {}
            circuit.connections
                .filter(c => c.toChip === chip.instanceId)
                .forEach(c => {
                    const fromChip = circuit.chips.find(ch => ch.instanceId === c.fromChip)
                    if (fromChip && fromChip.outputValues[c.fromPin] !== undefined) {
                        inputs[c.toPin] = fromChip.outputValues[c.fromPin]
                    }
                })
            // Execute
            setExecutionLogs(prev => [...prev, `Executing: ${def.name}`])
            try {
                const result = await def.execute(inputs, chip.params, executionStates[chip.instanceId], aiContext)
                chip.outputValues = result
                if (result._state) {
                    executionStates[chip.instanceId] = result._state
                }
                setExecutionLogs(prev => [...prev, `✓ ${def.name} completed`])
            } catch (error) {
                setExecutionLogs(prev => [...prev, `✗ ${def.name} failed: ${error}`])
                toast.error(`Error in ${def.name}: ${error}`)
            }
            executed.add(chip.instanceId)
        }
        // Execute all chips
        for (const chip of circuit.chips) {
            await executeChip(chip)
        }
        setCircuit(prev => ({ ...prev }))
        setIsRunning(false)
        setExecutionLogs(prev => [...prev, 'Execution complete'])
        toast.success('Circuit executed')
    }
    // Clear circuit
    const clearCircuit = () => {
        setCircuit({ chips: [], connections: [] })
        setExecutionLogs([])
        toast.success('Circuit cleared')
    }
    // Delete chip
    const deleteChip = (instanceId: string) => {
        setCircuit(prev => ({
            chips: prev.chips.filter(c => c.instanceId !== instanceId),
            connections: prev.connections.filter(c => c.fromChip !== instanceId && c.toChip !== instanceId)
        }))
        setSelectedChip(null)
        toast.success('Chip deleted')
    }
    // Update chip parameter
    const updateChipParam = (instanceId: string, paramName: string, value: unknown) => {
        setCircuit(prev => ({
            ...prev,
            chips: prev.chips.map(c =>
                c.instanceId === instanceId
                    ? { ...c, params: { ...c.params, [paramName]: value } }
                    : c
            )
        }))
    }
    // Get category chips
    const getCategoryChips = (category: ChipCategory) => CHIP_LIBRARY.filter(c => c.category === category)
    const categories: { id: ChipCategory; name: string; color: string }[] = [
        { id: 'ai', name: 'AI & LLM', color: '#06b6d4' },
        { id: 'workflow', name: 'Workflow', color: '#f97316' },
        { id: 'connector', name: 'Connectors', color: '#0ea5e9' },
        { id: 'input', name: 'Input', color: '#22c55e' },
        { id: 'output', name: 'Output', color: '#f43f5e' },
        { id: 'visual', name: 'Visual', color: '#8b5cf6' },
        { id: 'signal', name: 'Signal', color: '#10b981' },
        { id: 'data', name: 'Data', color: '#8b5cf6' },
        { id: 'math', name: 'Math', color: '#ec4899' },
        { id: 'logic', name: 'Logic', color: '#f59e0b' },
        { id: 'communication', name: 'Protocol', color: '#3b82f6' },
        { id: 'security', name: 'Security', color: '#ef4444' }
    ]
    // ============== PAGES ==============
    // Landing Page
    const LandingPage = () => (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* header */}
            <header className="border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50 bg-slate-900/80">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <CircuitBoard className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">SoftChip Studio</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-6">
                        <button onClick={() => setCurrentPage('home')} className="text-slate-300 hover:text-white transition">Home</button>
                        <button onClick={() => setCurrentPage('builder')} className="text-slate-300 hover:text-white transition">Builder</button>
                        <button onClick={() => setCurrentPage('tutorials')} className="text-slate-300 hover:text-white transition">Tutorials</button>
                        <Button onClick={() => setCurrentPage('builder')} className="bg-cyan-600 hover:bg-cyan-700">
                            <Play className="w-4 h-4 mr-2" /> Start Building
                        </Button>
                    </nav>
                    <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </header>
            {/* Mobile Menu */}
            {menuOpen && (
                <div className="md:hidden bg-slate-800 border-b border-slate-700 p-4 space-y-2">
                    <button onClick={() => { setCurrentPage('home'); setMenuOpen(false) }} className="block w-full text-left text-slate-300 hover:text-white p-2">Home</button>
                    <button onClick={() => { setCurrentPage('builder'); setMenuOpen(false) }} className="block w-full text-left text-slate-300 hover:text-white p-2">Builder</button>
                    <button onClick={() => { setCurrentPage('tutorials'); setMenuOpen(false) }} className="block w-full text-left text-slate-300 hover:text-white p-2">Tutorials</button>
                </div>
            )}
            {/* Hero */}
            <section className="max-w-7xl mx-auto px-4 py-20 text-center">
                <Badge className="mb-6 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    <Sparkles className="w-3 h-3 mr-1" /> AI-Powered Workflow Automation
                </Badge>
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                    Build <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Intelligent</span> Data Pipelines
                </h1>
                <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-8">
                    Connect AI models, APIs, and data processing chips visually. Like n8n meets hardware design — but for AI workflows.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <Button size="lg" onClick={() => setCurrentPage('builder')} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                        <Play className="w-5 h-5 mr-2" /> Start Building Free
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => setCurrentPage('tutorials')} className="border-slate-600 text-slate-300">
                        <BookOpen className="w-5 h-5 mr-2" /> View Tutorials
                    </Button>
                </div>
            </section>
            {/* AI Providers */}
            <section className="max-w-7xl mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-white mb-4">Supports All Major AI Providers</h2>
                    <p className="text-slate-400">Bring your own API keys and use any AI model</p>
                </div>
                <div className="flex flex-wrap justify-center gap-6">
                    {['OpenAI', 'Anthropic Claude', 'ZAI', 'Kimi', 'Qwen', 'Custom APIs'].map((provider) => (
                        <div key={provider} className="px-6 py-3 bg-slate-800/50 rounded-lg border border-slate-700 text-slate-300">
                            {provider}
                        </div>
                    ))}
                </div>
            </section>
            {/* Features */}
            <section className="max-w-7xl mx-auto px-4 py-16">
                <h2 className="text-3xl font-bold text-white text-center mb-12">Powerful Features</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { icon: <Bot className="w-8 h-8" />, title: 'AI Integration', desc: 'Connect GPT, Claude, Kimi, Qwen and more. Chain AI calls, manage context, build intelligent pipelines.' },
                        { icon: <Workflow className="w-8 h-8" />, title: 'Visual Workflows', desc: 'Drag-and-drop interface like n8n. Build complex automation without writing code.' },
                        { icon: <Signal className="w-8 h-8" />, title: 'Signal Processing', desc: 'FFT, filters, audio analysis. Process real audio files and visualize results.' },
                        { icon: <Globe className="w-8 h-8" />, title: 'API Connectors', desc: 'HTTP requests, webhooks, external APIs. Connect to any service with ease.' },
                        { icon: <Database className="w-8 h-8" />, title: 'Data Processing', desc: 'CSV, JSON, transformations. Process and analyze data from any source.' },
                        { icon: <Shield className="w-8 h-8" />, title: 'Secure by Design', desc: 'API keys stored locally. Your data never leaves your browser.' }
                    ].map((f, i) => (
                        <Card key={i} className="bg-slate-800/50 border-slate-700">
                            <CardHeader>
                                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center text-cyan-400 mb-4">
                                    {f.icon}
                                </div>
                                <CardTitle className="text-white">{f.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-400">{f.desc}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>
            {/* Templates */}
            <section className="max-w-7xl mx-auto px-4 py-16 bg-slate-800/30">
                <h2 className="text-3xl font-bold text-white text-center mb-4">Start with Templates</h2>
                <p className="text-slate-400 text-center mb-12">Pre-built workflows ready to customize</p>
                <div className="grid md:grid-cols-4 gap-4">
                    {TEMPLATES.slice(0, 8).map(t => (
                        <Card key={t.id} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 cursor-pointer transition" onClick={() => loadTemplate(t.id)}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-cyan-400">
                                        {t.icon}
                                    </div>
                                    <CardTitle className="text-white text-sm">{t.name}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-500 text-xs">{t.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>
            {/* CTA */}
            <section className="max-w-7xl mx-auto px-4 py-20 text-center">
                <h2 className="text-4xl font-bold text-white mb-4">Ready to Build?</h2>
                <p className="text-slate-400 mb-8">Start creating AI-powered workflows in minutes.</p>
                <Button size="lg" onClick={() => setCurrentPage('builder')} className="bg-gradient-to-r from-cyan-500 to-blue-600">
                    <Rocket className="w-5 h-5 mr-2" /> Launch Builder
                </Button>
            </section>
            {/* Footer */}
            <footer className="border-t border-slate-700/50 py-8">
                <div className="max-w-7xl mx-auto px-4 text-center text-slate-500">
                    <p>© 2024 SoftChip Studio. Open Source under Custom License.</p>
                    <p className="mt-2">Built with Next.js, TypeScript, and Tailwind CSS</p>
                </div>
            </footer>
        </div>
    )
    // Tutorials Page
    const TutorialsPage = () => (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <header className="border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50 bg-slate-900/80">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentPage('home')}>
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <CircuitBoard className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">SoftChip Studio</span>
                    </div>
                    <Button onClick={() => setCurrentPage('builder')} className="bg-cyan-600 hover:bg-cyan-700">
                        <Play className="w-4 h-4 mr-2" /> Open Builder
                    </button>
                </div>
            </header>
            <div className="max-w-4xl mx-auto px-4 py-12">
                <h1 className="text-4xl font-bold text-white mb-8">Tutorials</h1>
                <div className="space-y-6">
                    <Accordion type="single" collapsible className="space-y-4">
                        <AccordionItem value="ai-setup" className="bg-slate-800/50 border border-slate-700 rounded-lg px-4">
                            <AccordionTrigger className="text-white hover:text-cyan-400">
                                <div className="flex items-center gap-3">
                                    <Key className="w-5 h-5 text-cyan-400" />
                                    Setting Up AI Providers
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-slate-400 space-y-4">
                                <p>To use AI features, you need to configure at least one AI provider:</p>
                                <ol className="list-decimal list-inside space-y-2">
                                    <li>Click the Settings (gear) icon in the builder</li>
                                    <li>Enter your API key for Openai, Anthropic, or other providers</li>
                                    <li>For custom providers, enter the base URL and API key</li>
                                    <li>Click Save - your keys are stored locally in your browser</li>
                                </ol>
                                <p className="text-yellow-400 text-sm">⚠️ API keys are stored in localStorage. Never share your browser data.</p>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="ai-pipeline" className="bg-slate-800/50 border border-slate-700 rounded-lg px-4">
                            <AccordionTrigger className="text-white hover:text-cyan-400">
                                <div className="flex items-center gap-3">
                                    <Bot className="w-5 h-5 text-cyan-400" />
                                    Building AI Pipelines
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-slate-400 space-y-4">
                                <p>Create powerful AI workflows by connecting chips:</p>
                                <ol className="list-decimal list-inside space-y-2">
                                    <li>Add a <strong>Text Input</strong> chip for your prompt</li>
                                    <li>Add an <strong>AI Chat</strong> chip and connect the text output</li>
                                    <li>Configure the provider and model in chip settings</li>
                                    <li>Add <strong>AI Memory</strong> for conversation context</li>
                                    <li>Click <strong>Run</strong> to execute the pipeline</li>
                                </ol>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="multi-provider" className="bg-slate-800/50 border border-slate-700 rounded-lg px-4">
                            <AccordionTrigger className="text-white hover:text-cyan-400">
                                <div className="flex items-center gap-3">
                                    <GitBranch className="w-5 h-5 text-cyan-400" />
                                    Multi-provider AI Chains
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-slate-400 space-y-4">
                                <p>Chain different AI models together:</p>
                                <ul className="list-disc list-inside space-y-2">
                                    <li>Use <strong>OpenAI GPT-4</strong> for initial analysis</li>
                                    <li>Pass results to <strong>Claude</strong> for refinement</li>
                                    <li>Use <strong>Qwen</strong> for translation</li>
                                    <li>Generate images with <strong>Dall-e</strong></li>
                                </ul>
                                <p className="text-cyan-400 text-sm">💡 Each AI chip can use a different provider!</p>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="audio" className="bg-slate-800/50 border border-slate-700 rounded-lg px-4">
                            <AccordionTrigger className="text-white hover:text-cyan-400">
                                <div className="flex items-center gap-3">
                                    <AudioWaveform className="w-5 h-5 text-cyan-400" />
                                    Audio Signal Processing
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-slate-400 space-y-4">
                                <p>Process real audio files:</p>
                                <ol className="list-decimal list-inside space-y-2">
                                    <li>Add <strong>Audio File</strong> chip and upload a WAV/MP3</li>
                                    <li>Connect to <strong>FFT</strong> for frequency analysis</li>
                                    <li>Add <strong>Spectrum Display</strong> to visualize</li>
                                    <li>Use <strong>FIR Filter</strong> to filter frequencies</li>
                                    <li>Play processed audio with <strong>Audio Player</strong></li>
                                </ol>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="http" className="bg-slate-800/50 border border-slate-700 rounded-lg px-4">
                            <AccordionTrigger className="text-white hover:text-cyan-400">
                                <div className="flex items-center gap-3">
                                    <Globe className="w-5 h-5 text-cyan-400" />
                                    HTTP APIs & Webhooks
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-slate-400 space-y-4">
                                <p>Connect to external services:</p>
                                <ul className="list-disc list-inside space-y-2">
                                    <li><strong>HTTP Request</strong> - Make GET/POST requests</li>
                                    <li><strong>Webhook Receiver</strong> - Receive webhook data</li>
                                    <li>Process JSON responses with <strong>JSON Parser</strong></li>
                                    <li>Display results in <strong>Data Table</strong></li>
                                </ul>
                            </accordionContent>
                        </AccordionItem>
                        <AccordionItem value="workflow" className="bg-slate-800/50 border border-slate-700 rounded-lg px-4">
                            <AccordionTrigger className="text-white hover:text-cyan-400">
                                <div className="flex items-center gap-3">
                                    <Workflow className="w-5 h-5 text-cyan-400" />
                                    Workflow Automation (like n8n)
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-slate-400 space-y-4">
                                <p>Build automated workflows:</p>
                                <ul className="list-disc list-inside space-y-2">
                                    <li><strong>Workflow Trigger</strong> - start execution manually or via webhook</li>
                                    <li><strong>Condition</strong> - branch based on conditions</li>
                                    <li><strong>loop</strong> - iterate over arrays</li>
                                    <li><strong>Delay</strong> - wait before next step</li>
                                    <li><strong>Merge</strong> - combine multiple branches</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
                <div className="mt-12 text-center">
                    <Button size="lg" onClick={() => setCurrentPage('builder')} className="bg-gradient-to-r from-cyan-500 to-blue-600">
                        <Rocket className="w-5 h-5 mr-2" /> Start Building
                    </button>
                </div>
            </div>
        </div>
    )
    // Builder Page
    const BuilderPage = () => {
        const selectedChipData = selectedChip ? circuit.chips.find(c => c.instanceId === selectedChip) : null
        const selectedChipDef = selectedChipData ? getChipDef(selectedChipData.chipId) : null
        return (
            <div className="h-screen flex flex-col bg-slate-900">
                {/* Builder Header */}
                <header className="border-b border-slate-700 bg-slate-800 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setCurrentPage('home')} className="flex items-center gap-2 text-white hover:text-cyan-400 transition">
                            <CircuitBoard className="w-5 h-5" />
                            <span className="font-bold">SoftChip Studio</span>
                        </button>
                        <Separator orientation="vertical" className="h-6 bg-slate-600" />
                        <div className="flex gap-2">
                            <Button size="sm" onClick={runCircuit} disabled={isRunning} className="bg-emerald-600 hover:bg-emerald-700">
                                {isRunning ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
                                Run
                            </button>
                            <Button size="sm" onClick={clearCircuit} variant="destructive">
                                <Trash2 className="w-4 h-4 mr-1" /> Clear
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                                    <Key className="w-4 h-4 mr-1" /> AI Providers
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Configure AI Providers</DialogTitle>
                                    <DialogDescription className="text-slate-400">
                                        enter your API keys for AI features. Keys are stored locally in your browser.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {Object.entries(aiProviders).map(([key, provider]) => (
                                        <div key={key} className="space-y-2 p-3 bg-slate-700/50 rounded-lg">
                            <Label className="text-white font-medium">{provider.name}</Label>
                            <Input
                                type="password"
                                placeholder="API Key"
                                value={provider.apiKey}
                                onChange={(e) => updateProvider(key as keyof AIProviders, { apiKey: e.target.value })}
                                className="bg-slate-900 border-slate-600 text-white"
                            />
                            {key !== 'anthropic' && (
                                <Input
                                    type="text"
                                    placeholder="Base URL (optional)"
                                    value={provider.baseUrl || ''}
                                    onChange={(e) => updateProvider(key as keyof AIProviders, { baseUrl: e.target.value })}
                                    className="bg-slate-900 border-slate-600 text-white text-sm"
                                />
                            )}
                            {provider.models && provider.models.length > 0 && (
                                <p className="text-xs text-slate-500">Models: {provider.models.join(', ')}</p>
                            )}
                        </div>
                    ))}
                </div>
                                <DialogFooter>
                    <button onClick={() => setSettingsOpen(false)} className="bg-cyan-600">Done</button>
                </DialogFooter>
            </DialogContent>
                        </Dialog>
                        <Button size="sm" variant="outline" onClick={() => setCurrentPage('tutorials')} className="border-slate-600 text-slate-300">
                            <BookOpen className="w-4 h-4" />
                        </Button>
                    </div>
                </header>
                {/* Main Builder Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Toolbox Sidebar */}
                    <aside className="w-64 border-r border-slate-700 bg-slate-800 overflow-y-auto">
                        <div className="p-3">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Templates</h3>
                            <div className="space-y-1 mb-4">
                                {TEMPLates.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => loadTemplate(t.id)}
                                        className="w-full text-left px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-700 rounded flex items-center gap-2"
                                    >
                                        <span className="text-cyan-400">{t.icon}</span>
                                        <span className="truncate">{t.name}</span>
                                    </button>
                                ))}
                            </div>
                            <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">chips</h3>
                            {categories.map(cat => (
                                <div key={cat.id} className="mb-3">
                                    <h4 className="text-xs font-medium text-slate-400 mb-1 px-1">{cat.name}</h4>
                                    <div className="space-y-0.5">
                                        {getCategoryChips(cat.id).map(chip => (
                                            <button
                                                key={chip.id}
                                                onClick={() => placeChip(chip.id)}
                                                className="w-full text-left px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-700 rounded flex items-center gap-2"
                                            >
                                                <span style={{ color: chip.color }}>{chip.icon}</span>
                                                <span className="truncate">{chip.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                    {/* Canvas */}
                    <main className="flex-1 relative overflow-auto bg-slate-900" ref={canvasRef}>
                        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle, rgba(100,100,100,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                            {circuit.chips.map(chip => {
                                const def = getChipDef(chip.chipId)
                                if (!def) return null
                                const isSelected = selectedChip === chip.instanceId
                                return (
                                    <motion.div
                                        key={chip.instanceId}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className={`absolute cursor-pointer ${isSelected ? 'z-20' : 'z-10'}`}
                                        style={{ left: chip.position.x, top: chip.position.y }}
                                        onClick={() => setSelectedChip(chip.instanceId)}
                                    >
                                        <div
                                            className={`rounded-lg border-2 p-2 min-w-[140px] ${isSelected ? 'border-cyan-500 shadow-lg shadow-cyan-500/20' : 'border-slate-600'}`}
                                            style={{ backgroundColor: chip.color + '20' }}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: chip.color }}>
                                                    {def.icon}
                                                </div>
                                                <span className="text-xs font-medium text-white">{def.name}</span>
                                            </div>
                                            {/* Pins */}
                                            <div className="relative">
                                                {/* Input Pins */}
                                                <div className="flex flex-col gap-1 absolute -left-2 top-0">
                                                    {def.inputs.map(pin => (
                                                        <button
                                                            key={pin.id}
                                                            onClick={(e) => { e.stopPropagation(); handlePinClick(chip.instanceId, pin.id, false) }}
                                                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] ${connectingFrom && !connectingFrom.isOutput && connectingFrom.pinId === pin.id ? 'bg-cyan-500 border-cyan-400' : 'bg-slate-700 border-slate-500 hover:border-cyan-400'}`}
                                                            title={pin.description}
                                                        >
                                                            {connectingFrom?.pinId === pin.id && <div className="w-2 h-2 bg-white rounded-full" />}
                                                        }
                                                    </button>
                                                    ))}
                                                </div>
                                                {/* Output Pins */}
                                                <div className="flex flex-col gap-1 absolute -right-2 top-0">
                                                    {def.outputs.map(pin => (
                                                        <button
                                                            key={pin.id}
                                                            onClick={(e) => { e.stopPropagation(); handlePinClick(chip.instanceId, pin.id, true) }}
                                                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] ${connectingFrom && connectingFrom.isOutput && connectingFrom.pinId === pin.id ? 'bg-cyan-500 border-cyan-400' : 'bg-slate-700 border-slate-500 hover:border-cyan-400'}`}
                                                            title={pin.description}
                                                        >
                                                            {connectingFrom?.pinId === pin.id && <div className="w-2 h-2 bg-white rounded-full" />
                                                        }
                                                    </button>
                                                    ))}
                                                </div>
                                                {/* Output Values Preview */}
                                                {Object.keys(chip.outputValues).length > 0 && (
                                                    <div className="mt-2 text-[10px] text-slate-400">
                                                        {def.outputs.slice(0, 2).map(pin => (
                                                            <div key={pin.id} className="truncate">
                                                                {pin.name}: {typeof chip.outputValues[pin.id] === 'string'
                                    ? (chip.outputValues[pin.id] as string).slice(0, 20) + '...'
                                    : JSON.stringify(chip.outputValues[pin.id]).slice(0, 20)}
                                }
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        }
                                    </div>
                                )
                            })}
                            {/* Connection Lines */}
                            <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                                {circuit.connections.map(conn => {
                                    const fromChip = circuit.chips.find(c => c.instanceId === conn.fromChip)
                                    const toChip = circuit.chips.find(c => c.instanceId === conn.toChip)
                                    if (!fromChip || !toChip) return null
                                    const fromDef = getChipDef(fromChip.chipId)
                                    const toDef = getChipDef(toChip.chipId)
                                    if (!fromDef || !toDef) return null
                                    const fromPinIdx = fromDef.outputs.findIndex(p => p.id === conn.fromPin)
                                    const toPinIdx = toDef.inputs.findIndex(p => p.id === conn.toPin)
                                    const x1 = fromChip.position.x + 140
                                    const y1 = fromChip.position.y + 45 + fromPinIdx * 16
                                    const x2 = toChip.position.x
                                    const y2 = toChip.position.y + 45 + toPinIdx * 16
                                    const midX = (x1 + x2) / 2
                                    return (
                                        <path
                                            key={conn.id}
                                            d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                                            fill="none"
                                            stroke="#06b6d4"
                                            strokeWidth="2"
                                            className="opacity-70"
                                        />
                                    )
                                })}
                            </svg>
                            {connectingFrom && (
                                <div className="absolute bottom-4 left-4 bg-cyan-600 text-white px-3 py-2 rounded-lg text-sm">
                                    click on an {connectingFrom.isOutput ? 'input' : 'output'} pin to connect
                                </div>
                            )}
                        </div>
                    </main>
                    {/* Properties Panel */}
                    <aside className="w-72 border-l border-slate-700 bg-slate-800 overflow-y-auto">
                        {selectedChipData && selectedChipDef ? (
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-white font-medium">{selectedChipDef.name}</h3>
                                    <Button size="sm" variant="destructive" onClick={() => deleteChip(selectedChipData.instanceId)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-sm text-slate-400 mb-4">{selectedChipDef.description}</p>
                                {selectedChipDef.params && selectedChipDef.params.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase">Parameters</h4>
                                        {selectedChipDef.params.map(param => (
                                            <div key={param.name}>
                                                <Label className="text-slate-400 text-xs">{param.description || param.name}</Label>
                                                {param.type === 'string' && (
                                                    <Input
                                                        value={String(selectedChipData.params[param.name] || '')}
                                                        onChange={(e) => updateChipParam(selectedChipData.instanceId, param.name, e.target.value)}
                                                        className="bg-slate-900 border-slate-600 text-white mt-1"
                                                    />
                                                )}
                                                {param.type === 'number' && (
                                                    <Input
                                                        type="number"
                                                        value={Number(selectedChipData.params[param.name]) || 0}
                                                        onChange={(e) => updateChipParam(selectedChipData.instanceId, param.name, Number(e.target.value))}
                                                        className="bg-slate-900 border-slate-600 text-white mt-1"
                                                    />
                                                )}
                                                {param.type === 'boolean' && (
                                                    <Switch
                                                        checked={Boolean(selectedChipData.params[param.name])}
                                                        onCheckedChange={(v) => updateChipParam(selectedChipData.instanceId, param.name, v)}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {/* Show output values */}
                                {Object.keys(selectedChipData.outputValues).length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Output Values</h4>
                                        <div className="bg-slate-900 rounded p-2 text-xs text-slate-300 max-h-40 overflow-auto">
                                            <pre>{JSON.stringify(selectedChipData.outputValues, null, 2)}</pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 text-slate-500 text-center">
                                <p>select a chip to view properties</p>
                            </div>
                        )}
                        {/* Execution Logs */}
                        {executionLogs.length > 0 && (
                            <div className="border-t border-slate-700 p-4">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Execution Log</h4>
                                <div className="bg-slate-900 rounded p-2 text-xs text-slate-300 max-h-40 overflow-auto">
                                    {executionLogs.map((log, i) => (
                                        <div key={i} className={log.startsWith('✓') ? 'text-green-400' : log.startsWith('✗') ? 'text-red-400' : ''}>
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        )
    }
    // Render
    return (
        <TooltipProvider>
            {currentPage === 'home' && <LandingPage />}
            {currentPage === 'builder' && <BuilderPage />}
            {currentPage === 'tutorials' && <TutorialsPage />}
        </TooltipProvider>
    )
}
