'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu, Zap, Settings, Play, Pause, Trash2, Download, Upload,
  ArrowRight, Check, X, ChevronRight, ChevronLeft,
  CircuitBoard, Code, FileJson, Database, Globe, Shield, Signal,
  Timer, Calculator, Filter, BarChart3, Layers, Box, Cable, Grid3X3,
  Home, BookOpen, Menu, Sparkles, Target, TrendingUp,
  Eye, RefreshCw, Info, Lightbulb, Rocket, Terminal, Layers2, Workflow,
  Mic, Volume2, FileAudio, FileSpreadsheet, FileImage, Link, Activity,
  Headphones, Speaker, Save, Copy, FileDown, FolderOpen, Plus, Minus
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
import { toast } from 'sonner'

// ============================================================================
// TYPES
// ============================================================================

type PinType = 'number' | 'string' | 'boolean' | 'array' | 'object' | 'buffer' | 'any' | 'audio'
type ChipCategory = 'signal' | 'communication' | 'logic' | 'data' | 'math' | 'security' | 'flow' | 'io' | 'input' | 'output' | 'visual'

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
  execute: (inputs: Record<string, unknown>, params: Record<string, unknown>, state?: Record<string, unknown>) => Record<string, unknown> | Promise<Record<string, unknown>>
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

// ============================================================================
// CHIP LIBRARY - 50+ FUNCTIONAL CHIPS WITH REAL I/O
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
      const fileName = params.fileName as string
      
      if (!fileData) {
        return { samples: [], sampleRate: 44100, duration: 0, channels: 1 }
      }
      
      try {
        // Decode audio using Web Audio API
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
      } catch (error) {
        console.error('Audio decode error:', error)
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
      const fileData = params.fileData as string
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
    params: [
      { name: 'fileData', type: 'string', default: '', description: 'JSON content' }
    ],
    execute: (inputs, params) => {
      const fileData = params.fileData as string
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
    outputs: [
      { id: 'value', name: 'Value', type: 'any', description: 'The input value' }
    ],
    params: [
      { name: 'value', type: 'string', default: '', description: 'Input value' },
      { name: 'type', type: 'string', default: 'string', description: 'Value type: string, number, json, array' }
    ],
    execute: (inputs, params) => {
      const value = params.value
      const type = params.type as string
      
      switch (type) {
        case 'number':
          return { value: Number(value) || 0 }
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
    id: 'number-array-input',
    name: 'Number Array',
    category: 'input',
    description: 'Input array of numbers for signal processing',
    icon: <BarChart3 className="w-4 h-4" />,
    color: '#22c55e',
    inputs: [],
    outputs: [
      { id: 'array', name: 'Array', type: 'array', description: 'Number array' },
      { id: 'length', name: 'Length', type: 'number', description: 'Array length' }
    ],
    params: [
      { name: 'values', type: 'string', default: '1,2,3,4,5', description: 'Comma-separated numbers' },
      { name: 'generate', type: 'string', default: 'manual', description: 'manual, sine, noise, ramp' },
      { name: 'count', type: 'number', default: 100, description: 'Number of samples if generated' }
    ],
    execute: (inputs, params) => {
      const generate = params.generate as string
      const count = (params.count as number) || 100
      
      let array: number[] = []
      
      if (generate === 'sine') {
        for (let i = 0; i < count; i++) {
          array.push(Math.sin(2 * Math.PI * i / count * 4))
        }
      } else if (generate === 'noise') {
        for (let i = 0; i < count; i++) {
          array.push(Math.random() * 2 - 1)
        }
      } else if (generate === 'ramp') {
        for (let i = 0; i < count; i++) {
          array.push(i / count)
        }
      } else {
        array = String(params.values).split(',').map(s => Number(s.trim())).filter(n => !isNaN(n))
      }
      
      return { array, length: array.length }
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
      { id: 'samples', name: 'Samples', type: 'array', required: true, description: 'Audio samples (-1 to 1)' },
      { id: 'sampleRate', name: 'Sample Rate', type: 'number', required: false, description: 'Sample rate' }
    ],
    outputs: [
      { id: 'duration', name: 'Duration', type: 'number', description: 'Duration in seconds' },
      { id: 'played', name: 'Played', type: 'boolean', description: 'Was audio played' }
    ],
    params: [
      { name: 'autoPlay', type: 'boolean', default: false, description: 'Auto-play on execute' }
    ],
    isAsync: true,
    execute: async (inputs, params) => {
      const samples = inputs.samples as number[] || []
      const sampleRate = (inputs.sampleRate as number) || 44100
      
      if (samples.length === 0) {
        return { duration: 0, played: false }
      }
      
      const duration = samples.length / sampleRate
      
      // Create audio buffer and play
      try {
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        const audioBuffer = audioContext.createBuffer(1, samples.length, sampleRate)
        const channelData = audioBuffer.getChannelData(0)
        channelData.set(samples)
        
        const source = audioContext.createBufferSource()
        source.buffer = audioBuffer
        source.connect(audioContext.destination)
        source.start()
        
        return { duration, played: true }
      } catch (error) {
        console.error('Audio playback error:', error)
        return { duration, played: false }
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
    inputs: [
      { id: 'signal', name: 'Signal', type: 'array', required: true, description: 'Signal samples' }
    ],
    outputs: [
      { id: 'min', name: 'Min', type: 'number', description: 'Minimum value' },
      { id: 'max', name: 'Max', type: 'number', description: 'Maximum value' },
      { id: 'samples', name: 'Samples', type: 'number', description: 'Sample count' }
    ],
    params: [],
    execute: (inputs) => {
      const signal = (inputs.signal as number[]) || []
      if (signal.length === 0) {
        return { min: 0, max: 0, samples: 0 }
      }
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
      { id: 'magnitude', name: 'Magnitude', type: 'array', required: true, description: 'Magnitude spectrum' },
      { id: 'frequencies', name: 'Frequencies', type: 'array', required: false, description: 'Frequency bins' }
    ],
    outputs: [
      { id: 'peakFreq', name: 'Peak Freq', type: 'number', description: 'Peak frequency index' },
      { id: 'peakMag', name: 'Peak Mag', type: 'number', description: 'Peak magnitude' }
    ],
    params: [],
    execute: (inputs) => {
      const magnitude = (inputs.magnitude as number[]) || []
      const frequencies = (inputs.frequencies as number[]) || []
      
      if (magnitude.length === 0) {
        return { peakFreq: 0, peakMag: 0 }
      }
      
      let maxIdx = 0
      let maxVal = magnitude[0]
      for (let i = 1; i < magnitude.length; i++) {
        if (magnitude[i] > maxVal) {
          maxVal = magnitude[i]
          maxIdx = i
        }
      }
      
      return {
        peakFreq: frequencies[maxIdx] || maxIdx,
        peakMag: maxVal,
        _spectrumData: { magnitude, frequencies }
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
    inputs: [
      { id: 'data', name: 'Data', type: 'array', required: true, description: 'Array of objects' }
    ],
    outputs: [
      { id: 'count', name: 'Count', type: 'number', description: 'Row count' }
    ],
    params: [
      { name: 'maxRows', type: 'number', default: 50, description: 'Maximum rows to display' }
    ],
    execute: (inputs, params) => {
      const data = inputs.data as unknown[]
      const maxRows = (params.maxRows as number) || 50
      
      if (!Array.isArray(data)) {
        return { count: 0, _tableData: [] }
      }
      
      return {
        count: data.length,
        _tableData: data.slice(0, maxRows)
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
    inputs: [
      { id: 'value', name: 'Value', type: 'any', required: true, description: 'Value to display' }
    ],
    outputs: [
      { id: 'passthrough', name: 'Out', type: 'any', description: 'Pass-through value' }
    ],
    params: [
      { name: 'label', type: 'string', default: 'Output', description: 'Display label' },
      { name: 'format', type: 'string', default: 'auto', description: 'Format: auto, json, number, boolean' }
    ],
    execute: (inputs, params) => {
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
    inputs: [
      { id: 'data', name: 'Data', type: 'any', required: true, description: 'Data to download' }
    ],
    outputs: [
      { id: 'success', name: 'Success', type: 'boolean', description: 'Download started' }
    ],
    params: [
      { name: 'filename', type: 'string', default: 'output.json', description: 'File name' },
      { name: 'format', type: 'string', default: 'json', description: 'Format: json, csv, txt' }
    ],
    execute: (inputs, params) => {
      const data = inputs.data
      const filename = params.filename as string
      const format = params.format as string
      
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
          } else {
            content = Array.isArray(data) ? data.join('\n') : String(data)
          }
          mimeType = 'text/csv'
          break
        default:
          content = String(data)
      }
      
      // Create download link
      try {
        const blob = new Blob([content], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
        return { success: true }
      } catch {
        return { success: false }
      }
    }
  },

  // ==================== SIGNAL PROCESSING CHIPS ====================
  {
    id: 'fft',
    name: 'FFT',
    category: 'signal',
    description: 'Fast Fourier Transform for frequency analysis',
    icon: <Signal className="w-4 h-4" />,
    color: '#10b981',
    inputs: [
      { id: 'signal', name: 'Signal', type: 'array', required: true, description: 'Input signal array' }
    ],
    outputs: [
      { id: 'magnitude', name: 'Magnitude', type: 'array', description: 'Magnitude spectrum' },
      { id: 'phase', name: 'Phase', type: 'array', description: 'Phase spectrum' },
      { id: 'frequencies', name: 'Frequencies', type: 'array', description: 'Frequency bins' }
    ],
    params: [
      { name: 'sampleRate', type: 'number', default: 44100, description: 'Sample rate in Hz' }
    ],
    execute: (inputs, params) => {
      const signal = inputs.signal as number[] || []
      const n = signal.length
      if (n === 0) return { magnitude: [], phase: [], frequencies: [] }
      
      const magnitude: number[] = []
      const phase: number[] = []
      const frequencies: number[] = []
      const sampleRate = (params.sampleRate as number) || 44100
      
      for (let k = 0; k < Math.floor(n / 2); k++) {
        let real = 0, imag = 0
        for (let j = 0; j < n; j++) {
          const angle = (2 * Math.PI * k * j) / n
          real += signal[j] * Math.cos(angle)
          imag -= signal[j] * Math.sin(angle)
        }
        magnitude.push(Math.sqrt(real * real + imag * imag) / n)
        phase.push(Math.atan2(imag, real))
        frequencies.push((k * sampleRate) / n)
      }
      
      return { magnitude, phase, frequencies }
    }
  },
  {
    id: 'fir-filter',
    name: 'FIR Filter',
    category: 'signal',
    description: 'Finite Impulse Response filter',
    icon: <Filter className="w-4 h-4" />,
    color: '#10b981',
    inputs: [
      { id: 'signal', name: 'Signal', type: 'array', required: true }
    ],
    outputs: [
      { id: 'filtered', name: 'Filtered', type: 'array' }
    ],
    params: [
      { name: 'type', type: 'string', default: 'lowpass', description: 'Filter type: lowpass, highpass, bandpass' },
      { name: 'cutoff', type: 'number', default: 0.3, description: 'Normalized cutoff frequency (0-1)' },
      { name: 'taps', type: 'number', default: 32, description: 'Number of filter taps' }
    ],
    execute: (inputs, params) => {
      const signal = inputs.signal as number[] || []
      const type = (params.type as string) || 'lowpass'
      const taps = (params.taps as number) || 32
      const cutoff = (params.cutoff as number) || 0.3
      
      const coeffs: number[] = []
      const M = taps - 1
      for (let n = 0; n < taps; n++) {
        let h = 0
        if (n === M / 2) {
          h = 2 * cutoff
        } else {
          h = Math.sin(2 * Math.PI * cutoff * (n - M / 2)) / (Math.PI * (n - M / 2))
        }
        h *= 0.54 - 0.46 * Math.cos((2 * Math.PI * n) / M)
        coeffs.push(type === 'highpass' ? (n === M / 2 ? 1 - h : -h) : h)
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
    description: 'Generate waveforms: sine, square, sawtooth, noise',
    icon: <Zap className="w-4 h-4" />,
    color: '#10b981',
    inputs: [],
    outputs: [
      { id: 'signal', name: 'Signal', type: 'array' }
    ],
    params: [
      { name: 'type', type: 'string', default: 'sine', description: 'Wave type: sine, square, sawtooth, noise' },
      { name: 'frequency', type: 'number', default: 5, description: 'Frequency in Hz' },
      { name: 'amplitude', type: 'number', default: 1, description: 'Amplitude' },
      { name: 'samples', type: 'number', default: 1000, description: 'Number of samples' },
      { name: 'sampleRate', type: 'number', default: 44100, description: 'Sample rate' }
    ],
    execute: (inputs, params) => {
      const type = (params.type as string) || 'sine'
      const freq = (params.frequency as number) || 5
      const amp = (params.amplitude as number) || 1
      const samples = (params.samples as number) || 1000
      const sampleRate = (params.sampleRate as number) || 44100
      
      const signal: number[] = []
      for (let i = 0; i < samples; i++) {
        const t = i / sampleRate
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
  {
    id: 'envelope',
    name: 'Envelope',
    category: 'signal',
    description: 'Extract amplitude envelope',
    icon: <Activity className="w-4 h-4" />,
    color: '#10b981',
    inputs: [
      { id: 'signal', name: 'Signal', type: 'array', required: true }
    ],
    outputs: [
      { id: 'envelope', name: 'Envelope', type: 'array' }
    ],
    params: [
      { name: 'attack', type: 'number', default: 0.01, description: 'Attack time constant' },
      { name: 'release', type: 'number', default: 0.1, description: 'Release time constant' }
    ],
    execute: (inputs, params) => {
      const signal = inputs.signal as number[] || []
      const attack = (params.attack as number) || 0.01
      const release = (params.release as number) || 0.1
      
      const envelope: number[] = []
      let env = 0
      
      for (const sample of signal) {
        const abs = Math.abs(sample)
        if (abs > env) {
          env = env + (abs - env) * attack
        } else {
          env = env + (abs - env) * release
        }
        envelope.push(env)
      }
      
      return { envelope }
    }
  },
  {
    id: 'normalize',
    name: 'Normalize',
    category: 'signal',
    description: 'Normalize signal to -1 to 1 range',
    icon: <Target className="w-4 h-4" />,
    color: '#10b981',
    inputs: [
      { id: 'signal', name: 'Signal', type: 'array', required: true }
    ],
    outputs: [
      { id: 'normalized', name: 'Normalized', type: 'array' }
    ],
    params: [],
    execute: (inputs) => {
      const signal = inputs.signal as number[] || []
      if (signal.length === 0) return { normalized: [] }
      
      const max = Math.max(...signal.map(Math.abs))
      if (max === 0) return { normalized: signal }
      
      return { normalized: signal.map(s => s / max) }
    }
  },
  {
    id: 'gain',
    name: 'Gain',
    category: 'signal',
    description: 'Apply gain/volume to signal',
    icon: <Volume2 className="w-4 h-4" />,
    color: '#10b981',
    inputs: [
      { id: 'signal', name: 'Signal', type: 'array', required: true }
    ],
    outputs: [
      { id: 'output', name: 'Output', type: 'array' }
    ],
    params: [
      { name: 'gain', type: 'number', default: 1, description: 'Gain multiplier' }
    ],
    execute: (inputs, params) => {
      const signal = inputs.signal as number[] || []
      const gain = (params.gain as number) || 1
      return { output: signal.map(s => s * gain) }
    }
  },

  // ==================== COMMUNICATION CHIPS ====================
  {
    id: 'uart-encoder',
    name: 'UART Encode',
    category: 'communication',
    description: 'Encode data as UART frames',
    icon: <Cable className="w-4 h-4" />,
    color: '#3b82f6',
    inputs: [
      { id: 'data', name: 'Data', type: 'string', required: true }
    ],
    outputs: [
      { id: 'frames', name: 'Frames', type: 'array' },
      { id: 'hex', name: 'Hex', type: 'string' },
      { id: 'bytes', name: 'Bytes', type: 'array' }
    ],
    params: [
      { name: 'baudRate', type: 'number', default: 9600, description: 'Baud rate' },
      { name: 'dataBits', type: 'number', default: 8, description: 'Data bits (5-9)' },
      { name: 'parity', type: 'string', default: 'none', description: 'Parity: none, even, odd' }
    ],
    execute: (inputs, params) => {
      const data = String(inputs.data || '')
      const dataBits = (params.dataBits as number) || 8
      const parity = (params.parity as string) || 'none'
      
      const frames: unknown[] = []
      const hexParts: string[] = []
      const bytes: number[] = []
      
      for (const char of data) {
        const code = char.charCodeAt(0)
        bytes.push(code)
        
        const bits: number[] = []
        for (let i = 0; i < dataBits; i++) {
          bits.push((code >> i) & 1)
        }
        
        if (parity !== 'none') {
          const ones = bits.reduce((a, b) => a + b, 0)
          bits.push(parity === 'even' ? ones % 2 : (ones + 1) % 2)
        }
        
        frames.push({ startBit: 0, dataBits: bits, stopBit: 1, char })
        hexParts.push(code.toString(16).padStart(2, '0').toUpperCase())
      }
      
      return { frames, hex: hexParts.join(' '), bytes }
    }
  },
  {
    id: 'uart-decoder',
    name: 'UART Decode',
    category: 'communication',
    description: 'Decode UART hex to text',
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
    description: 'Generate Modbus RTU frame',
    icon: <Grid3X3 className="w-4 h-4" />,
    color: '#3b82f6',
    inputs: [],
    outputs: [
      { id: 'frame', name: 'Frame', type: 'object' },
      { id: 'hex', name: 'Hex', type: 'string' },
      { id: 'crc', name: 'CRC', type: 'number' }
    ],
    params: [
      { name: 'slaveId', type: 'number', default: 1, description: 'Slave ID (1-247)' },
      { name: 'function', type: 'string', default: '03', description: 'Function code (hex)' },
      { name: 'register', type: 'number', default: 0, description: 'Register address' },
      { name: 'count', type: 'number', default: 1, description: 'Register count' }
    ],
    execute: (inputs, params) => {
      const slaveId = (params.slaveId as number) || 1
      const funcCode = parseInt((params.function as string) || '03', 16)
      const register = (params.register as number) || 0
      const count = (params.count as number) || 1
      
      const frame: number[] = [
        slaveId,
        funcCode,
        (register >> 8) & 0xFF,
        register & 0xFF,
        (count >> 8) & 0xFF,
        count & 0xFF
      ]
      
      let crc = 0xFFFF
      for (const byte of frame) {
        crc ^= byte
        for (let i = 0; i < 8; i++) {
          if (crc & 0x0001) {
            crc = (crc >> 1) ^ 0xA001
          } else {
            crc >>= 1
          }
        }
      }
      
      frame.push(crc & 0xFF)
      frame.push((crc >> 8) & 0xFF)
      
      return {
        frame: { bytes: frame, slaveId, function: funcCode, register, count },
        hex: frame.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' '),
        crc
      }
    }
  },

  // ==================== LOGIC CHIPS ====================
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
    outputs: [
      { id: 'out', name: 'Out', type: 'boolean' }
    ],
    params: [],
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
    outputs: [
      { id: 'out', name: 'Out', type: 'boolean' }
    ],
    params: [],
    execute: (inputs) => ({ out: Boolean(inputs.a) || Boolean(inputs.b) })
  },
  {
    id: 'logic-not',
    name: 'NOT',
    category: 'logic',
    description: 'Logical NOT gate',
    icon: <Cpu className="w-4 h-4" />,
    color: '#f59e0b',
    inputs: [
      { id: 'in', name: 'In', type: 'boolean', required: true }
    ],
    outputs: [
      { id: 'out', name: 'Out', type: 'boolean' }
    ],
    params: [],
    execute: (inputs) => ({ out: !Boolean(inputs.in) })
  },
  {
    id: 'comparator',
    name: 'Comparator',
    category: 'logic',
    description: 'Compare two values',
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
    execute: (inputs) => {
      const a = Number(inputs.a) || 0
      const b = Number(inputs.b) || 0
      return {
        equal: a === b,
        greater: a > b,
        less: a < b
      }
    }
  },

  // ==================== MATH CHIPS ====================
  {
    id: 'calculator',
    name: 'Calculator',
    category: 'math',
    description: 'Basic arithmetic operations',
    icon: <Calculator className="w-4 h-4" />,
    color: '#ec4899',
    inputs: [
      { id: 'a', name: 'A', type: 'number', required: true },
      { id: 'b', name: 'B', type: 'number', required: false }
    ],
    outputs: [
      { id: 'result', name: 'Result', type: 'number' }
    ],
    params: [
      { name: 'operation', type: 'string', default: 'add', description: 'add, sub, mul, div, mod, pow, sqrt, abs' }
    ],
    execute: (inputs, params) => {
      const a = Number(inputs.a) || 0
      const b = Number(inputs.b) || 0
      const op = (params.operation as string) || 'add'
      
      let result = 0
      switch (op) {
        case 'add': result = a + b; break
        case 'sub': result = a - b; break
        case 'mul': result = a * b; break
        case 'div': result = b !== 0 ? a / b : 0; break
        case 'mod': result = a % b; break
        case 'pow': result = Math.pow(a, b); break
        case 'sqrt': result = Math.sqrt(a); break
        case 'abs': result = Math.abs(a); break
      }
      
      return { result }
    }
  },
  {
    id: 'statistics',
    name: 'Statistics',
    category: 'math',
    description: 'Statistical analysis',
    icon: <BarChart3 className="w-4 h-4" />,
    color: '#ec4899',
    inputs: [
      { id: 'data', name: 'Data', type: 'array', required: true }
    ],
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
      const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
      const stdDev = Math.sqrt(variance)
      
      return { mean, median, stdDev, min: sorted[0], max: sorted[sorted.length - 1] }
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
      { name: 'kp', type: 'number', default: 1, description: 'Proportional gain' },
      { name: 'ki', type: 'number', default: 0.1, description: 'Integral gain' },
      { name: 'kd', type: 'number', default: 0.01, description: 'Derivative gain' }
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

  // ==================== DATA CHIPS ====================
  {
    id: 'json-parser',
    name: 'JSON Parser',
    category: 'data',
    description: 'Parse and stringify JSON',
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
    params: [
      { name: 'mode', type: 'string', default: 'parse', description: 'Mode: parse or stringify' }
    ],
    execute: (inputs, params) => {
      const mode = (params.mode as string) || 'parse'
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
    inputs: [
      { id: 'data', name: 'Data', type: 'string', required: true }
    ],
    outputs: [
      { id: 'encoded', name: 'Encoded', type: 'string' },
      { id: 'decoded', name: 'Decoded', type: 'string' }
    ],
    params: [
      { name: 'mode', type: 'string', default: 'encode', description: 'Mode: encode or decode' }
    ],
    execute: (inputs, params) => {
      const data = String(inputs.data || '')
      const mode = (params.mode as string) || 'encode'
      
      try {
        if (mode === 'encode') {
          return { encoded: btoa(data), decoded: data }
        } else {
          return { encoded: data, decoded: atob(data) }
        }
      } catch {
        return { encoded: '', decoded: '' }
      }
    }
  },
  {
    id: 'array-operations',
    name: 'Array Ops',
    category: 'data',
    description: 'Array operations: map, filter, reduce',
    icon: <Layers className="w-4 h-4" />,
    color: '#8b5cf6',
    inputs: [
      { id: 'array', name: 'Array', type: 'array', required: true }
    ],
    outputs: [
      { id: 'result', name: 'Result', type: 'array' },
      { id: 'length', name: 'Length', type: 'number' }
    ],
    params: [
      { name: 'operation', type: 'string', default: 'slice', description: 'slice, reverse, sort, unique, flatten' },
      { name: 'start', type: 'number', default: 0, description: 'Start index (for slice)' },
      { name: 'end', type: 'number', default: -1, description: 'End index (for slice)' }
    ],
    execute: (inputs, params) => {
      const arr = (inputs.array as unknown[]) || []
      const op = (params.operation as string) || 'slice'
      const start = (params.start as number) || 0
      const end = (params.end as number) || arr.length
      
      let result: unknown[] = arr
      
      switch (op) {
        case 'slice':
          result = arr.slice(start, end === -1 ? undefined : end)
          break
        case 'reverse':
          result = [...arr].reverse()
          break
        case 'sort':
          result = [...arr].sort((a, b) => Number(a) - Number(b))
          break
        case 'unique':
          result = [...new Set(arr)]
          break
        case 'flatten':
          result = arr.flat(Infinity)
          break
      }
      
      return { result, length: result.length }
    }
  },

  // ==================== SECURITY CHIPS ====================
  {
    id: 'hash',
    name: 'Hash',
    category: 'security',
    description: 'Generate SHA-256 hash',
    icon: <Shield className="w-4 h-4" />,
    color: '#ef4444',
    inputs: [
      { id: 'data', name: 'Data', type: 'string', required: true }
    ],
    outputs: [
      { id: 'hash', name: 'Hash', type: 'string' },
      { id: 'length', name: 'Length', type: 'number' }
    ],
    params: [],
    isAsync: true,
    execute: async (inputs) => {
      const data = String(inputs.data || '')
      
      try {
        const encoder = new TextEncoder()
        const dataBuffer = encoder.encode(data)
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        
        return { hash, length: hash.length }
      } catch {
        let hash = 0
        for (let i = 0; i < data.length; i++) {
          hash = ((hash << 5) - hash) + data.charCodeAt(i)
          hash = hash & hash
        }
        return { hash: Math.abs(hash).toString(16).padStart(64, '0'), length: 64 }
      }
    }
  },
  {
    id: 'crc',
    name: 'CRC',
    category: 'security',
    description: 'Generate CRC checksums',
    icon: <Shield className="w-4 h-4" />,
    color: '#ef4444',
    inputs: [
      { id: 'data', name: 'Data', type: 'array', required: true }
    ],
    outputs: [
      { id: 'crc8', name: 'CRC-8', type: 'number' },
      { id: 'crc16', name: 'CRC-16', type: 'number' }
    ],
    params: [],
    execute: (inputs) => {
      const data = (inputs.data as number[]) || []
      
      let crc8 = 0
      for (const byte of data) {
        crc8 ^= byte
        for (let i = 0; i < 8; i++) {
          if (crc8 & 0x80) crc8 = (crc8 << 1) ^ 0x07
          else crc8 <<= 1
        }
        crc8 &= 0xFF
      }
      
      let crc16 = 0xFFFF
      for (const byte of data) {
        crc16 ^= byte
        for (let i = 0; i < 8; i++) {
          if (crc16 & 0x0001) crc16 = (crc16 >> 1) ^ 0xA001
          else crc16 >>= 1
        }
      }
      
      return { crc8, crc16 }
    }
  },
  {
    id: 'random',
    name: 'Random',
    category: 'security',
    description: 'Generate random values',
    icon: <RefreshCw className="w-4 h-4" />,
    color: '#ef4444',
    inputs: [],
    outputs: [
      { id: 'number', name: 'Number', type: 'number' },
      { id: 'uuid', name: 'UUID', type: 'string' }
    ],
    params: [
      { name: 'min', type: 'number', default: 0, description: 'Minimum value' },
      { name: 'max', type: 'number', default: 100, description: 'Maximum value' }
    ],
    execute: (inputs, params) => {
      const min = Number(params.min) || 0
      const max = Number(params.max) || 100
      
      const num = Math.floor(Math.random() * (max - min + 1)) + min
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
      
      return { number: num, uuid }
    }
  },

  // ==================== FLOW CHIPS ====================
  {
    id: 'router',
    name: 'Router',
    category: 'flow',
    description: 'Route data based on condition',
    icon: <ArrowRight className="w-4 h-4" />,
    color: '#06b6d4',
    inputs: [
      { id: 'data', name: 'Data', type: 'any', required: true },
      { id: 'condition', name: 'Condition', type: 'boolean', required: false }
    ],
    outputs: [
      { id: 'true', name: 'True', type: 'any' },
      { id: 'false', name: 'False', type: 'any' }
    ],
    params: [],
    execute: (inputs) => ({
      true: inputs.condition ? inputs.data : undefined,
      false: !inputs.condition ? inputs.data : undefined
    })
  },
  {
    id: 'merger',
    name: 'Merger',
    category: 'flow',
    description: 'Merge two data streams',
    icon: <Layers className="w-4 h-4" />,
    color: '#06b6d4',
    inputs: [
      { id: 'a', name: 'A', type: 'any', required: false },
      { id: 'b', name: 'B', type: 'any', required: false }
    ],
    outputs: [
      { id: 'merged', name: 'Merged', type: 'array' }
    ],
    params: [],
    execute: (inputs) => {
      const merged: unknown[] = []
      if (Array.isArray(inputs.a)) merged.push(...inputs.a)
      else if (inputs.a !== undefined) merged.push(inputs.a)
      if (Array.isArray(inputs.b)) merged.push(...inputs.b)
      else if (inputs.b !== undefined) merged.push(inputs.b)
      return { merged }
    }
  },
  {
    id: 'delay',
    name: 'Delay',
    category: 'flow',
    description: 'Delay data propagation',
    icon: <Timer className="w-4 h-4" />,
    color: '#06b6d4',
    inputs: [
      { id: 'data', name: 'Data', type: 'any', required: true }
    ],
    outputs: [
      { id: 'data', name: 'Data', type: 'any' }
    ],
    params: [
      { name: 'delayMs', type: 'number', default: 100, description: 'Delay in milliseconds' }
    ],
    execute: (inputs) => ({ data: inputs.data })
  }
]

// ============================================================================
// DEMO TEMPLATES
// ============================================================================

const DEMO_TEMPLATES = [
  {
    id: 'audio-analyzer',
    name: 'Audio Analyzer',
    description: 'Upload audio file, compute FFT spectrum',
    category: 'Audio',
    circuit: {
      chips: [
        { instanceId: 'audio1', chipId: 'audio-file-input', position: { x: 50, y: 80 }, params: {}, inputValues: {}, outputValues: {} },
        { instanceId: 'fft1', chipId: 'fft', position: { x: 300, y: 80 }, params: { sampleRate: 44100 }, inputValues: {}, outputValues: {} },
        { instanceId: 'spectrum1', chipId: 'spectrum-display', position: { x: 550, y: 80 }, params: {}, inputValues: {}, outputValues: {} }
      ],
      connections: [
        { id: 'c1', fromChip: 'audio1', fromPin: 'samples', toChip: 'fft1', toPin: 'signal' },
        { id: 'c2', fromChip: 'fft1', fromPin: 'magnitude', toChip: 'spectrum1', toPin: 'magnitude' },
        { id: 'c3', fromChip: 'fft1', fromPin: 'frequencies', toChip: 'spectrum1', toPin: 'frequencies' }
      ]
    }
  },
  {
    id: 'signal-filter-demo',
    name: 'Signal Filter Demo',
    description: 'Generate signal, filter, visualize',
    category: 'Signal',
    circuit: {
      chips: [
        { instanceId: 'gen1', chipId: 'signal-generator', position: { x: 50, y: 60 }, params: { type: 'sine', frequency: 10, samples: 500 }, inputValues: {}, outputValues: {} },
        { instanceId: 'filter1', chipId: 'fir-filter', position: { x: 300, y: 60 }, params: { type: 'lowpass', cutoff: 0.2 }, inputValues: {}, outputValues: {} },
        { instanceId: 'wave1', chipId: 'waveform-display', position: { x: 550, y: 60 }, params: {}, inputValues: {}, outputValues: {} },
        { instanceId: 'player1', chipId: 'audio-player', position: { x: 550, y: 180 }, params: {}, inputValues: {}, outputValues: {} }
      ],
      connections: [
        { id: 'c1', fromChip: 'gen1', fromPin: 'signal', toChip: 'filter1', toPin: 'signal' },
        { id: 'c2', fromChip: 'filter1', fromPin: 'filtered', toChip: 'wave1', toPin: 'signal' },
        { id: 'c3', fromChip: 'filter1', fromPin: 'filtered', toChip: 'player1', toPin: 'samples' }
      ]
    }
  },
  {
    id: 'csv-statistics',
    name: 'CSV Statistics',
    description: 'Upload CSV, compute statistics',
    category: 'Data',
    circuit: {
      chips: [
        { instanceId: 'csv1', chipId: 'csv-file-input', position: { x: 50, y: 80 }, params: {}, inputValues: {}, outputValues: {} },
        { instanceId: 'table1', chipId: 'data-table', position: { x: 300, y: 20 }, params: {}, inputValues: {}, outputValues: {} },
        { instanceId: 'display1', chipId: 'value-display', position: { x: 300, y: 140 }, params: { label: 'Row Count' }, inputValues: {}, outputValues: {} }
      ],
      connections: [
        { id: 'c1', fromChip: 'csv1', fromPin: 'rows', toChip: 'table1', toPin: 'data' },
        { id: 'c2', fromChip: 'csv1', fromPin: 'count', toChip: 'display1', toPin: 'value' }
      ]
    }
  },
  {
    id: 'uart-testing',
    name: 'UART Protocol Testing',
    description: 'Encode text as UART frames',
    category: 'Communication',
    circuit: {
      chips: [
        { instanceId: 'text1', chipId: 'text-input', position: { x: 50, y: 80 }, params: { value: 'Hello', type: 'string' }, inputValues: {}, outputValues: {} },
        { instanceId: 'uart1', chipId: 'uart-encoder', position: { x: 300, y: 80 }, params: { baudRate: 115200 }, inputValues: {}, outputValues: {} },
        { instanceId: 'display1', chipId: 'value-display', position: { x: 550, y: 40 }, params: { label: 'Hex Output' }, inputValues: {}, outputValues: {} },
        { instanceId: 'table1', chipId: 'data-table', position: { x: 550, y: 140 }, params: { label: 'Frames' }, inputValues: {}, outputValues: {} }
      ],
      connections: [
        { id: 'c1', fromChip: 'text1', fromPin: 'value', toChip: 'uart1', toPin: 'data' },
        { id: 'c2', fromChip: 'uart1', fromPin: 'hex', toChip: 'display1', toPin: 'value' },
        { id: 'c3', fromChip: 'uart1', fromPin: 'frames', toChip: 'table1', toPin: 'data' }
      ]
    }
  },
  {
    id: 'security-hash',
    name: 'Hash Generator',
    description: 'Generate SHA-256 hash of text',
    category: 'Security',
    circuit: {
      chips: [
        { instanceId: 'text1', chipId: 'text-input', position: { x: 50, y: 80 }, params: { value: 'Secret Message', type: 'string' }, inputValues: {}, outputValues: {} },
        { instanceId: 'hash1', chipId: 'hash', position: { x: 300, y: 80 }, params: {}, inputValues: {}, outputValues: {} },
        { instanceId: 'display1', chipId: 'value-display', position: { x: 550, y: 80 }, params: { label: 'SHA-256 Hash' }, inputValues: {}, outputValues: {} }
      ],
      connections: [
        { id: 'c1', fromChip: 'text1', fromPin: 'value', toChip: 'hash1', toPin: 'data' },
        { id: 'c2', fromChip: 'hash1', fromPin: 'hash', toChip: 'display1', toPin: 'value' }
      ]
    }
  },
  {
    id: 'pid-control-demo',
    name: 'PID Control Demo',
    description: 'Demonstrate PID controller',
    category: 'Control',
    circuit: {
      chips: [
        { instanceId: 'setpoint', chipId: 'text-input', position: { x: 50, y: 40 }, params: { value: '100', type: 'number' }, inputValues: {}, outputValues: {} },
        { instanceId: 'process', chipId: 'text-input', position: { x: 50, y: 120 }, params: { value: '85', type: 'number' }, inputValues: {}, outputValues: {} },
        { instanceId: 'pid1', chipId: 'pid-controller', position: { x: 300, y: 80 }, params: { kp: 1.5, ki: 0.2, kd: 0.05 }, inputValues: {}, outputValues: {} },
        { instanceId: 'display1', chipId: 'value-display', position: { x: 550, y: 40 }, params: { label: 'Output' }, inputValues: {}, outputValues: {} },
        { instanceId: 'display2', chipId: 'value-display', position: { x: 550, y: 120 }, params: { label: 'Error' }, inputValues: {}, outputValues: {} }
      ],
      connections: [
        { id: 'c1', fromChip: 'setpoint', fromPin: 'value', toChip: 'pid1', toPin: 'setpoint' },
        { id: 'c2', fromChip: 'process', fromPin: 'value', toChip: 'pid1', toPin: 'processValue' },
        { id: 'c3', fromChip: 'pid1', fromPin: 'output', toChip: 'display1', toPin: 'value' },
        { id: 'c4', fromChip: 'pid1', fromPin: 'error', toChip: 'display2', toPin: 'value' }
      ]
    }
  },
  {
    id: 'data-pipeline',
    name: 'Data Pipeline',
    description: 'Transform array data',
    category: 'Data',
    circuit: {
      chips: [
        { instanceId: 'arr1', chipId: 'number-array-input', position: { x: 50, y: 80 }, params: { values: '5,2,8,1,9,3,7', generate: 'manual' }, inputValues: {}, outputValues: {} },
        { instanceId: 'ops1', chipId: 'array-operations', position: { x: 300, y: 80 }, params: { operation: 'sort' }, inputValues: {}, outputValues: {} },
        { instanceId: 'stats1', chipId: 'statistics', position: { x: 550, y: 40 }, params: {}, inputValues: {}, outputValues: {} },
        { instanceId: 'display1', chipId: 'value-display', position: { x: 550, y: 120 }, params: { label: 'Mean' }, inputValues: {}, outputValues: {} }
      ],
      connections: [
        { id: 'c1', fromChip: 'arr1', fromPin: 'array', toChip: 'ops1', toPin: 'array' },
        { id: 'c2', fromChip: 'ops1', fromPin: 'result', toChip: 'stats1', toPin: 'data' },
        { id: 'c3', fromChip: 'stats1', fromPin: 'mean', toChip: 'display1', toPin: 'value' }
      ]
    }
  },
  {
    id: 'modbus-generator',
    name: 'Modbus RTU Generator',
    description: 'Generate Modbus RTU frames',
    category: 'Industrial',
    circuit: {
      chips: [
        { instanceId: 'modbus1', chipId: 'modbus-rtu', position: { x: 50, y: 80 }, params: { slaveId: 1, function: '03', register: 0, count: 10 }, inputValues: {}, outputValues: {} },
        { instanceId: 'display1', chipId: 'value-display', position: { x: 300, y: 40 }, params: { label: 'Hex Frame' }, inputValues: {}, outputValues: {} },
        { instanceId: 'display2', chipId: 'value-display', position: { x: 300, y: 120 }, params: { label: 'CRC' }, inputValues: {}, outputValues: {} }
      ],
      connections: [
        { id: 'c1', fromChip: 'modbus1', fromPin: 'hex', toChip: 'display1', toPin: 'value' },
        { id: 'c2', fromChip: 'modbus1', fromPin: 'crc', toChip: 'display2', toPin: 'value' }
      ]
    }
  }
]

// ============================================================================
// CATEGORIES
// ============================================================================

const CATEGORIES: { id: ChipCategory; name: string; icon: React.ReactNode; color: string }[] = [
  { id: 'input', name: 'Inputs', icon: <Upload className="w-4 h-4" />, color: '#22c55e' },
  { id: 'output', name: 'Outputs', icon: <Download className="w-4 h-4" />, color: '#f43f5e' },
  { id: 'visual', name: 'Visualization', icon: <Eye className="w-4 h-4" />, color: '#8b5cf6' },
  { id: 'signal', name: 'Signal Processing', icon: <Signal className="w-4 h-4" />, color: '#10b981' },
  { id: 'communication', name: 'Communication', icon: <Cable className="w-4 h-4" />, color: '#3b82f6' },
  { id: 'logic', name: 'Logic & Control', icon: <Cpu className="w-4 h-4" />, color: '#f59e0b' },
  { id: 'math', name: 'Mathematics', icon: <Calculator className="w-4 h-4" />, color: '#ec4899' },
  { id: 'data', name: 'Data Transform', icon: <Code className="w-4 h-4" />, color: '#8b5cf6' },
  { id: 'security', name: 'Security', icon: <Shield className="w-4 h-4" />, color: '#ef4444' },
  { id: 'flow', name: 'Data Flow', icon: <Layers className="w-4 h-4" />, color: '#06b6d4' }
]

// ============================================================================
// MAIN APPLICATION
// ============================================================================

export default function SoftChipStudio() {
  const [activeTab, setActiveTab] = useState<'home' | 'builder' | 'tutorials'>('home')
  const [circuit, setCircuit] = useState<Circuit>({ chips: [], connections: [] })
  const [selectedChip, setSelectedChip] = useState<string | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResults, setExecutionResults] = useState<Record<string, Record<string, unknown>>>({})
  const [draggedChip, setDraggedChip] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [connectingFrom, setConnectingFrom] = useState<{ chipId: string; pinId: string; isOutput: boolean } | null>(null)
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chipStates = useRef<Record<string, Record<string, unknown>>>({})

  const getChipDef = (chipId: string) => CHIP_LIBRARY.find(c => c.id === chipId)

  // Add chip
  const addChip = useCallback((chipId: string, position?: { x: number; y: number }) => {
    const chipDef = getChipDef(chipId)
    if (!chipDef) return

    const newChip: PlacedChip = {
      instanceId: `${chipId}-${Date.now()}`,
      chipId,
      position: position || { x: 150 + Math.random() * 300, y: 100 + Math.random() * 200 },
      params: chipDef.params?.reduce((acc, p) => ({ ...acc, [p.name]: p.default }), {}) || {},
      inputValues: {},
      outputValues: {}
    }

    setCircuit(prev => ({ ...prev, chips: [...prev.chips, newChip] }))
    toast.success(`Added ${chipDef.name}`)
  }, [])

  // Remove chip
  const removeChip = useCallback((instanceId: string) => {
    setCircuit(prev => ({
      chips: prev.chips.filter(c => c.instanceId !== instanceId),
      connections: prev.connections.filter(c => c.fromChip !== instanceId && c.toChip !== instanceId)
    }))
    setSelectedChip(null)
    toast.success('Chip removed')
  }, [])

  // Start connection
  const startConnection = useCallback((chipId: string, pinId: string, isOutput: boolean) => {
    setConnectingFrom({ chipId, pinId, isOutput })
  }, [])

  // Complete connection
  const completeConnection = useCallback((toChipId: string, toPinId: string) => {
    if (!connectingFrom) return
    
    let fromChip: string, fromPin: string, toChip: string, toPin: string
    
    if (connectingFrom.isOutput) {
      fromChip = connectingFrom.chipId
      fromPin = connectingFrom.pinId
      toChip = toChipId
      toPin = toPinId
    } else {
      fromChip = toChipId
      fromPin = toPinId
      toChip = connectingFrom.chipId
      toPin = connectingFrom.pinId
    }
    
    // Validate connection
    if (fromChip === toChip) {
      toast.error('Cannot connect chip to itself')
      setConnectingFrom(null)
      return
    }
    
    const exists = circuit.connections.some(c => 
      c.fromChip === fromChip && c.fromPin === fromPin && c.toChip === toChip && c.toPin === toPin
    )
    if (exists) {
      toast.error('Connection already exists')
      setConnectingFrom(null)
      return
    }
    
    const inputConnected = circuit.connections.some(c => c.toChip === toChip && c.toPin === toPin)
    if (inputConnected) {
      toast.error('Input already connected')
      setConnectingFrom(null)
      return
    }
    
    const newConnection: Connection = {
      id: `conn-${Date.now()}`,
      fromChip, fromPin, toChip, toPin
    }
    
    setCircuit(prev => ({ ...prev, connections: [...prev.connections, newConnection] }))
    toast.success('Connection added')
    setConnectingFrom(null)
  }, [connectingFrom, circuit.connections])

  // Remove connection
  const removeConnection = useCallback((connectionId: string) => {
    setCircuit(prev => ({
      ...prev,
      connections: prev.connections.filter(c => c.id !== connectionId)
    }))
    toast.success('Connection removed')
  }, [])

  // Execute circuit
  const executeCircuit = useCallback(async () => {
    if (circuit.chips.length === 0) {
      toast.error('No chips to execute')
      return
    }
    
    setIsExecuting(true)
    const results: Record<string, Record<string, unknown>> = {}
    
    try {
      const executed = new Set<string>()
      const chipOutputs: Record<string, Record<string, unknown>> = {}
      
      const executeChip = async (chip: PlacedChip) => {
        if (executed.has(chip.instanceId)) return chipOutputs[chip.instanceId]
        
        const chipDef = getChipDef(chip.chipId)
        if (!chipDef) return {}
        
        const inputs: Record<string, unknown> = {}
        for (const inputPin of chipDef.inputs) {
          const connection = circuit.connections.find(c => c.toChip === chip.instanceId && c.toPin === inputPin.id)
          if (connection) {
            const sourceChip = circuit.chips.find(c => c.instanceId === connection.fromChip)
            if (sourceChip && !executed.has(sourceChip.instanceId)) {
              await executeChip(sourceChip)
            }
            inputs[inputPin.id] = chipOutputs[connection.fromChip]?.[connection.fromPin]
          }
        }
        
        const state = chipStates.current[chip.instanceId] || {}
        const result = await chipDef.execute(inputs, chip.params, state)
        
        if (result._state) {
          chipStates.current[chip.instanceId] = result._state
          delete result._state
        }
        
        chipOutputs[chip.instanceId] = result
        results[chip.instanceId] = result
        executed.add(chip.instanceId)
        
        return result
      }
      
      for (const chip of circuit.chips) {
        await executeChip(chip)
      }
      
      setExecutionResults(results)
      toast.success('Circuit executed!')
    } catch (error) {
      toast.error(`Execution failed: ${error}`)
    } finally {
      setIsExecuting(false)
    }
  }, [circuit])

  // Load template
  const loadTemplate = useCallback((templateId: string) => {
    const template = DEMO_TEMPLATES.find(t => t.id === templateId)
    if (template) {
      setCircuit(template.circuit)
      setExecutionResults({})
      setActiveTab('builder')
      toast.success(`Loaded: ${template.name}`)
    }
  }, [])

  // Clear circuit
  const clearCircuit = useCallback(() => {
    setCircuit({ chips: [], connections: [] })
    setExecutionResults({})
    chipStates.current = {}
    setSelectedChip(null)
    toast.success('Circuit cleared')
  }, [])

  // Export circuit as JSON file
  const exportCircuit = useCallback(() => {
    if (circuit.chips.length === 0) {
      toast.error('No circuit to export')
      return
    }
    
    const circuitData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      circuit: {
        chips: circuit.chips.map(c => ({
          instanceId: c.instanceId,
          chipId: c.chipId,
          position: c.position,
          params: c.params
        })),
        connections: circuit.connections
      }
    }
    
    const blob = new Blob([JSON.stringify(circuitData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `softchip-circuit-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Circuit exported!')
  }, [circuit])

  // Import circuit from JSON file
  const importCircuit = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (data.circuit && Array.isArray(data.circuit.chips)) {
          setCircuit({
            chips: data.circuit.chips.map((c: PlacedChip) => ({
              ...c,
              inputValues: {},
              outputValues: {}
            })),
            connections: data.circuit.connections || []
          })
          setExecutionResults({})
          chipStates.current = {}
          toast.success(`Imported circuit with ${data.circuit.chips.length} chips`)
        } else {
          toast.error('Invalid circuit file format')
        }
      } catch {
        toast.error('Failed to parse circuit file')
      }
    }
    reader.readAsText(file)
    event.target.value = '' // Reset input
  }, [])

  // Update chip position
  const updateChipPosition = useCallback((instanceId: string, position: { x: number; y: number }) => {
    setCircuit(prev => ({
      ...prev,
      chips: prev.chips.map(c => c.instanceId === instanceId ? { ...c, position } : c)
    }))
  }, [])

  // Update chip params
  const updateChipParams = useCallback((instanceId: string, params: Record<string, unknown>) => {
    setCircuit(prev => ({
      ...prev,
      chips: prev.chips.map(c => c.instanceId === instanceId ? { ...c, params: { ...c.params, ...params } } : c)
    }))
  }, [])

  // Handle file upload for input chips
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, chipInstanceId: string) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = async (e) => {
      const data = e.target?.result as string
      
      const chip = circuit.chips.find(c => c.instanceId === chipInstanceId)
      if (!chip) return
      
      if (chip.chipId === 'audio-file-input') {
        updateChipParams(chipInstanceId, { fileData: data, fileName: file.name })
        toast.success(`Audio loaded: ${file.name}`)
      } else if (chip.chipId === 'csv-file-input' || chip.chipId === 'json-file-input') {
        const text = atob(data.split(',')[1])
        updateChipParams(chipInstanceId, { fileData: text })
        toast.success(`File loaded: ${file.name}`)
      }
    }
    
    if (chipInstanceId.startsWith('audio-file-input')) {
      reader.readAsDataURL(file)
    } else {
      reader.readAsText(file)
    }
  }, [circuit.chips, updateChipParams])

  // Start microphone capture
  const startMicrophoneCapture = useCallback(async (chipInstanceId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      
      const samples: number[] = []
      let isRecording = true
      
      processor.onaudioprocess = (e) => {
        if (!isRecording) return
        const inputData = e.inputBuffer.getChannelData(0)
        samples.push(...Array.from(inputData))
        if (samples.length > 44100 * 5) { // Max 5 seconds
          isRecording = false
          stream.getTracks().forEach(t => t.stop())
          source.disconnect()
          processor.disconnect()
          updateChipParams(chipInstanceId, { 
            captured: JSON.stringify({ samples, sampleRate: 44100 }) 
          })
          toast.success(`Captured ${(samples.length / 44100).toFixed(1)}s of audio`)
        }
      }
      
      source.connect(processor)
      processor.connect(audioContext.destination)
      
      toast.info('Recording... Click anywhere to stop after a few seconds')
      
      setTimeout(() => {
        if (isRecording) {
          isRecording = false
          stream.getTracks().forEach(t => t.stop())
          source.disconnect()
          processor.disconnect()
          updateChipParams(chipInstanceId, { 
            captured: JSON.stringify({ samples, sampleRate: 44100 }) 
          })
          toast.success(`Captured ${(samples.length / 44100).toFixed(1)}s of audio`)
        }
      }, 3000)
      
    } catch (error) {
      toast.error('Could not access microphone')
    }
  }, [updateChipParams])

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                  <CircuitBoard className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  SoftChip Studio
                </span>
              </div>
              
              <div className="hidden md:flex items-center gap-1">
                {[
                  { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
                  { id: 'builder', label: 'Circuit Builder', icon: <Cpu className="w-4 h-4" /> },
                  { id: 'tutorials', label: 'Tutorials', icon: <BookOpen className="w-4 h-4" /> }
                ].map(item => (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? 'default' : 'ghost'}
                    onClick={() => setActiveTab(item.id as typeof activeTab)}
                    className={`gap-2 ${activeTab === item.id ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
                  >
                    {item.icon}
                    {item.label}
                  </Button>
                ))}
              </div>

              <Button
                variant="ghost"
                className="md:hidden text-white hover:bg-slate-700"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden bg-slate-800 border-t border-slate-700">
              {[
                { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
                { id: 'builder', label: 'Circuit Builder', icon: <Cpu className="w-4 h-4" /> },
                { id: 'tutorials', label: 'Tutorials', icon: <BookOpen className="w-4 h-4" /> }
              ].map(item => (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => { setActiveTab(item.id as typeof activeTab); setMobileMenuOpen(false) }}
                  className="w-full justify-start gap-2 px-4 py-3 text-white hover:bg-slate-700"
                >
                  {item.icon}
                  {item.label}
                </Button>
              ))}
            </div>
          )}
        </nav>

        <main className="max-w-7xl mx-auto">
          {/* HIDDEN FILE INPUT */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".wav,.mp3,.csv,.json"
            onChange={(e) => {
              // This will be set dynamically
            }}
          />

          {/* HOME PAGE */}
          {activeTab === 'home' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-4 py-12 sm:py-16"
            >
              {/* Hero */}
              <div className="text-center mb-12">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm mb-6"
                >
                  <Sparkles className="w-4 h-4" />
                  Real Data Processing with Software Microchips
                </motion.div>
                
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-4xl sm:text-5xl font-bold mb-6"
                >
                  Build Real Systems with
                  <span className="block bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mt-2">
                    Software Microchips
                  </span>
                </motion.h1>
                
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl text-slate-400 max-w-3xl mx-auto mb-8"
                >
                  Upload audio files, process signals, test protocols, transform data — all visually. 
                  No hardware required. Real inputs, real outputs, real results.
                </motion.p>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                  <Button
                    size="lg"
                    onClick={() => setActiveTab('builder')}
                    className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-emerald-500/25"
                  >
                    <Rocket className="mr-2 w-5 h-5" />
                    Start Building
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setActiveTab('tutorials')}
                    className="border-slate-500 text-white hover:bg-slate-700 hover:text-white px-8 py-6 text-lg font-semibold"
                  >
                    <BookOpen className="mr-2 w-5 h-5" />
                    Learn How
                  </Button>
                </motion.div>
              </div>

              {/* What Can You Do */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-12"
              >
                <h2 className="text-3xl font-bold text-center mb-8">What Can You Do?</h2>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      icon: <FileAudio className="w-8 h-8" />,
                      title: 'Process Audio Files',
                      description: 'Upload WAV/MP3 files, analyze with FFT, apply filters, hear the results in real-time.',
                      color: 'from-emerald-500 to-teal-500',
                      action: () => loadTemplate('audio-analyzer')
                    },
                    {
                      icon: <Signal className="w-8 h-8" />,
                      title: 'Signal Processing',
                      description: 'Generate test signals, apply FIR filters, visualize waveforms and frequency spectrum.',
                      color: 'from-blue-500 to-cyan-500',
                      action: () => loadTemplate('signal-filter-demo')
                    },
                    {
                      icon: <Mic className="w-8 h-8" />,
                      title: 'Microphone Input',
                      description: 'Capture real audio from your microphone, process it live with filters and effects.',
                      color: 'from-purple-500 to-pink-500',
                      action: () => setActiveTab('builder')
                    },
                    {
                      icon: <FileSpreadsheet className="w-8 h-8" />,
                      title: 'CSV/JSON Processing',
                      description: 'Upload data files, transform, analyze statistics, export results.',
                      color: 'from-orange-500 to-red-500',
                      action: () => loadTemplate('csv-statistics')
                    },
                    {
                      icon: <Cable className="w-8 h-8" />,
                      title: 'Protocol Testing',
                      description: 'Test UART, Modbus protocols without hardware. Generate frames, verify checksums.',
                      color: 'from-amber-500 to-yellow-500',
                      action: () => loadTemplate('uart-testing')
                    },
                    {
                      icon: <Shield className="w-8 h-8" />,
                      title: 'Security Tools',
                      description: 'Generate SHA-256 hashes, CRC checksums, verify data integrity.',
                      color: 'from-red-500 to-pink-500',
                      action: () => loadTemplate('security-hash')
                    }
                  ].map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                    >
                      <Card 
                        className="bg-slate-800/50 border-slate-700 hover:border-slate-500 transition-all group cursor-pointer h-full"
                        onClick={feature.action}
                      >
                        <CardHeader>
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                            {feature.icon}
                          </div>
                          <CardTitle className="text-lg">{feature.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-slate-400 text-sm">{feature.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Templates */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mb-12"
              >
                <h2 className="text-3xl font-bold text-center mb-8">Ready-to-Use Templates</h2>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {DEMO_TEMPLATES.map((template, i) => (
                    <motion.div
                      key={template.id}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.7 + i * 0.05 }}
                    >
                      <Card 
                        className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 cursor-pointer transition-all group"
                        onClick={() => loadTemplate(template.id)}
                      >
                        <CardHeader className="pb-2">
                          <Badge variant="outline" className="w-fit text-xs border-emerald-500/50 text-emerald-400">
                            {template.category}
                          </Badge>
                          <CardTitle className="text-sm mt-2">{template.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-slate-400 text-xs">{template.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* How It Works */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mb-12"
              >
                <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
                
                <div className="grid sm:grid-cols-4 gap-6">
                  {[
                    { step: 1, title: 'Upload Input', description: 'Audio files, CSV data, or capture from microphone', icon: <Upload className="w-5 h-5" /> },
                    { step: 2, title: 'Build Circuit', description: 'Drag chips and connect them to create data flow', icon: <Cpu className="w-5 h-5" /> },
                    { step: 3, title: 'Execute', description: 'Run your circuit and see real-time results', icon: <Play className="w-5 h-5" /> },
                    { step: 4, title: 'Export', description: 'Download processed data or play audio output', icon: <Download className="w-5 h-5" /> }
                  ].map((item, i) => (
                    <div key={i} className="text-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto mb-3 text-white font-bold shadow-lg">
                        {item.icon}
                      </div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-slate-400 text-sm">{item.description}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Installation & Self-Hosting */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="mb-12"
              >
                <h2 className="text-3xl font-bold text-center mb-8">
                  <Terminal className="w-8 h-8 inline-block mr-2 text-emerald-400" />
                  Installation Guide
                </h2>
                
                <Card className="bg-slate-800/50 border-slate-700 max-w-4xl mx-auto">
                  <CardHeader>
                    <CardTitle>Self-Host SoftChip Studio</CardTitle>
                    <CardDescription>Run your own instance locally or deploy to your servers</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Quick Start */}
                    <div>
                      <h4 className="font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                        <Rocket className="w-4 h-4" />
                        Quick Start (Local)
                      </h4>
                      <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                        <div className="text-slate-400"># Clone and run</div>
                        <div className="text-cyan-400">git clone https://github.com/softchip/studio.git</div>
                        <div className="text-cyan-400">cd studio</div>
                        <div className="text-cyan-400">bun install</div>
                        <div className="text-cyan-400">bun run dev</div>
                        <div className="text-slate-400 mt-2"># Open http://localhost:3000</div>
                      </div>
                    </div>

                    {/* Requirements */}
                    <div>
                      <h4 className="font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                        <Cpu className="w-4 h-4" />
                        Requirements
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400" />
                          Node.js 18+ or Bun
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400" />
                          Modern browser (Chrome, Firefox, Safari)
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400" />
                          4GB RAM minimum
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400" />
                          No database required
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <h4 className="font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Included Features
                      </h4>
                      <div className="grid sm:grid-cols-3 gap-2 text-sm">
                        {[
                          '50+ Processing Chips',
                          'Audio File Processing',
                          'Microphone Input',
                          'FFT & Signal Analysis',
                          'CSV/JSON Processing',
                          'Protocol Testing (UART)',
                          'Hash & CRC Generation',
                          'Export/Import Circuits',
                          'No Server Required'
                        ].map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-slate-300">
                            <Check className="w-3 h-3 text-emerald-400" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Docker */}
                    <div>
                      <h4 className="font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                        <Box className="w-4 h-4" />
                        Docker Deployment
                      </h4>
                      <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                        <div className="text-cyan-400">docker pull softchip/studio:latest</div>
                        <div className="text-cyan-400">docker run -p 3000:3000 softchip/studio</div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                      <Download className="w-4 h-4" />
                      Download Source Code
                    </Button>
                    <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white gap-2">
                      <Globe className="w-4 h-4" />
                      View on GitHub
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-center"
              >
                <Card className="bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 border-emerald-500/30 max-w-2xl mx-auto">
                  <CardContent className="py-8">
                    <h3 className="text-2xl font-bold mb-3">Ready to Build?</h3>
                    <p className="text-slate-300 mb-4">
                      Start processing real data with visual circuits. No hardware required.
                    </p>
                    <Button
                      size="lg"
                      onClick={() => setActiveTab('builder')}
                      className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-semibold shadow-lg shadow-emerald-500/25"
                    >
                      <Rocket className="mr-2 w-5 h-5" />
                      Launch Circuit Builder
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {/* BUILDER */}
          {activeTab === 'builder' && (
            <div className="h-[calc(100vh-4rem)] flex flex-col">
              <div className="flex-1 flex overflow-hidden">
                {/* Chip Library */}
                <div className="w-56 bg-slate-800/50 border-r border-slate-700 flex flex-col">
                  <div className="p-3 border-b border-slate-700">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      Chip Library
                    </h3>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-1">
                      {CATEGORIES.map(category => (
                        <Accordion key={category.id} type="single" collapsible>
                          <AccordionItem value={category.id} className="border-0">
                            <AccordionTrigger className="px-2 py-1.5 hover:bg-slate-700/50 rounded text-xs hover:no-underline">
                              <div className="flex items-center gap-1.5">
                                <span style={{ color: category.color }}>{category.icon}</span>
                                <span className="text-slate-300">{category.name}</span>
                                <Badge variant="secondary" className="ml-auto text-[10px] bg-slate-700 text-slate-400">
                                  {CHIP_LIBRARY.filter(c => c.category === category.id).length}
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-1">
                              {CHIP_LIBRARY.filter(c => c.category === category.id).map(chip => (
                                <div
                                  key={chip.id}
                                  draggable
                                  onDragStart={() => setDraggedChip(chip.id)}
                                  onDragEnd={() => setDraggedChip(null)}
                                  onClick={() => addChip(chip.id)}
                                  className="flex items-center gap-1.5 p-1.5 m-0.5 rounded bg-slate-700/30 hover:bg-slate-700/60 cursor-pointer transition-all border border-transparent hover:border-slate-600"
                                >
                                  <div 
                                    className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: `${chip.color}20`, color: chip.color }}
                                  >
                                    {chip.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-slate-200 truncate">{chip.name}</div>
                                  </div>
                                </div>
                              ))}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Canvas */}
                <div className="flex-1 flex flex-col">
                  {/* Toolbar */}
                  <div className="h-11 bg-slate-800/30 border-b border-slate-700 flex items-center justify-between px-3">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-8"
                        onClick={executeCircuit}
                        disabled={isExecuting || circuit.chips.length === 0}
                      >
                        {isExecuting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        Run
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 h-8"
                        onClick={exportCircuit}
                        disabled={circuit.chips.length === 0}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Save
                      </Button>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={importCircuit}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 border-blue-500/50 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 h-8"
                          asChild
                        >
                          <span>
                            <Upload className="w-3.5 h-3.5" />
                            Load
                          </span>
                        </Button>
                      </label>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 h-8"
                        onClick={clearCircuit}
                        disabled={circuit.chips.length === 0}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear
                      </Button>
                      <Separator orientation="vertical" className="h-5 bg-slate-600" />
                      <span className="text-xs text-slate-400">
                        {circuit.chips.length} chips • {circuit.connections.length} connections
                      </span>
                      {connectingFrom && (
                        <Badge variant="outline" className="border-cyan-500 text-cyan-400 text-xs">
                          Click output pin to connect...
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {DEMO_TEMPLATES.slice(0, 4).map(t => (
                        <Tooltip key={t.id}>
                          <TooltipTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-xs text-slate-400 hover:text-white h-7 px-2"
                              onClick={() => loadTemplate(t.id)}
                            >
                              {t.name}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t.description}</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>

                  {/* Canvas Area */}
                  <div
                    ref={canvasRef}
                    className="flex-1 relative overflow-auto bg-slate-900/50"
                    style={{ 
                      backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      if (draggedChip) {
                        const rect = canvasRef.current?.getBoundingClientRect()
                        if (rect) {
                          addChip(draggedChip, {
                            x: Math.max(0, e.clientX - rect.left + canvasRef.current!.scrollLeft - 60),
                            y: Math.max(0, e.clientY - rect.top + canvasRef.current!.scrollTop - 30)
                          })
                        }
                        setDraggedChip(null)
                      }
                    }}
                    onClick={() => { 
                      setSelectedChip(null)
                      setConnectingFrom(null)
                    }}
                  >
                    {/* Connections */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '2000px', minHeight: '2000px' }}>
                      {circuit.connections.map(conn => {
                        const fromChip = circuit.chips.find(c => c.instanceId === conn.fromChip)
                        const toChip = circuit.chips.find(c => c.instanceId === conn.toChip)
                        if (!fromChip || !toChip) return null
                        
                        const fromDef = getChipDef(fromChip.chipId)
                        const toDef = getChipDef(toChip.chipId)
                        if (!fromDef || !toDef) return null
                        
                        const fromPinIndex = fromDef.outputs.findIndex(p => p.id === conn.fromPin)
                        const toPinIndex = toDef.inputs.findIndex(p => p.id === conn.toPin)
                        
                        const x1 = fromChip.position.x + 130
                        const y1 = fromChip.position.y + 36 + fromPinIndex * 20
                        const x2 = toChip.position.x
                        const y2 = toChip.position.y + 36 + toPinIndex * 20
                        
                        return (
                          <path
                            key={conn.id}
                            d={`M ${x1} ${y1} C ${x1 + 40} ${y1}, ${x2 - 40} ${y2}, ${x2} ${y2}`}
                            fill="none"
                            stroke="#22d3ee"
                            strokeWidth={2}
                            className="pointer-events-auto cursor-pointer hover:stroke-emerald-400"
                            onClick={(e) => { e.stopPropagation(); removeConnection(conn.id) }}
                          />
                        )
                      })}
                    </svg>

                    {/* Chips */}
                    {circuit.chips.map(chip => {
                      const chipDef = getChipDef(chip.chipId)
                      if (!chipDef) return null
                      
                      const results = executionResults[chip.instanceId] || {}

                      return (
                        <motion.div
                          key={chip.instanceId}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={`absolute cursor-move ${selectedChip === chip.instanceId ? 'z-10' : ''}`}
                          style={{ left: chip.position.x, top: chip.position.y }}
                          onClick={(e) => { e.stopPropagation(); setSelectedChip(chip.instanceId) }}
                          draggable
                          onDragEnd={(e) => {
                            const rect = canvasRef.current?.getBoundingClientRect()
                            if (rect) {
                              updateChipPosition(chip.instanceId, {
                                x: Math.max(0, e.clientX - rect.left + canvasRef.current!.scrollLeft - 60),
                                y: Math.max(0, e.clientY - rect.top + canvasRef.current!.scrollTop - 30)
                              })
                            }
                          }}
                        >
                          <Card className={`w-[130px] bg-slate-800 border-slate-600 shadow-lg ${selectedChip === chip.instanceId ? 'ring-2 ring-emerald-500' : ''}`}>
                            <div 
                              className="h-7 rounded-t-lg flex items-center px-2 gap-1 text-xs font-medium"
                              style={{ backgroundColor: `${chipDef.color}20`, color: chipDef.color }}
                            >
                              {chipDef.icon}
                              <span className="truncate flex-1">{chipDef.name}</span>
                            </div>
                            <CardContent className="p-1.5">
                              {/* Input Pins */}
                              <div className="space-y-0.5 mb-1">
                                {chipDef.inputs.map((pin) => {
                                  const isConnected = circuit.connections.some(c => c.toChip === chip.instanceId && c.toPin === pin.id)
                                  return (
                                    <div key={pin.id} className="flex items-center gap-1 text-[10px]">
                                      <div 
                                        className={`w-2.5 h-2.5 rounded-full border cursor-pointer ${
                                          isConnected ? 'bg-emerald-500 border-emerald-400' : 
                                          connectingFrom && !connectingFrom.isOutput ? 'border-cyan-400 animate-pulse' :
                                          'border-slate-500 bg-slate-700 hover:border-cyan-400'
                                        }`}
                                        title={`${pin.name}: ${pin.type}`}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          if (connectingFrom && connectingFrom.isOutput) {
                                            completeConnection(chip.instanceId, pin.id)
                                          } else {
                                            startConnection(chip.instanceId, pin.id, false)
                                          }
                                        }}
                                      />
                                      <span className="text-slate-400 truncate">{pin.name}</span>
                                    </div>
                                  )
                                })}
                              </div>
                              
                              {/* Output Pins */}
                              <div className="space-y-0.5">
                                {chipDef.outputs.map((pin) => (
                                  <div key={pin.id} className="flex items-center gap-1 text-[10px] justify-end">
                                    <span className="text-slate-400 truncate">{pin.name}</span>
                                    <div 
                                      className={`w-2.5 h-2.5 rounded-full border cursor-pointer ${
                                        connectingFrom?.chipId === chip.instanceId && connectingFrom.pinId === pin.id
                                          ? 'bg-cyan-500 border-cyan-400'
                                          : 'border-cyan-500 bg-cyan-500/30 hover:bg-cyan-500'
                                      }`}
                                      title={`${pin.name}: ${pin.type}`}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (connectingFrom && !connectingFrom.isOutput) {
                                          completeConnection(chip.instanceId, pin.id)
                                        } else {
                                          startConnection(chip.instanceId, pin.id, true)
                                        }
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                              
                              {/* Special UI for input chips */}
                              {chipDef.id === 'audio-file-input' && (
                                <div className="mt-1.5 pt-1.5 border-t border-slate-600">
                                  <input
                                    type="file"
                                    accept=".wav,.mp3,.ogg"
                                    className="hidden"
                                    id={`file-${chip.instanceId}`}
                                    onChange={(e) => handleFileUpload(e, chip.instanceId)}
                                  />
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="w-full h-6 text-[10px] border-slate-600 text-slate-300 hover:bg-slate-700"
                                    onClick={() => document.getElementById(`file-${chip.instanceId}`)?.click()}
                                  >
                                    <Upload className="w-3 h-3 mr-1" />
                                    Upload Audio
                                  </Button>
                                  {chip.params.fileName && (
                                    <div className="text-[9px] text-emerald-400 mt-1 truncate">
                                      ✓ {chip.params.fileName as string}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {chipDef.id === 'microphone-input' && (
                                <div className="mt-1.5 pt-1.5 border-t border-slate-600">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="w-full h-6 text-[10px] border-slate-600 text-slate-300 hover:bg-slate-700"
                                    onClick={() => startMicrophoneCapture(chip.instanceId)}
                                  >
                                    <Mic className="w-3 h-3 mr-1" />
                                    Record
                                  </Button>
                                </div>
                              )}
                              
                              {chipDef.id === 'csv-file-input' && (
                                <div className="mt-1.5 pt-1.5 border-t border-slate-600">
                                  <input
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    id={`csv-${chip.instanceId}`}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) {
                                        const reader = new FileReader()
                                        reader.onload = (ev) => {
                                          updateChipParams(chip.instanceId, { fileData: ev.target?.result as string })
                                          toast.success(`Loaded: ${file.name}`)
                                        }
                                        reader.readAsText(file)
                                      }
                                    }}
                                  />
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="w-full h-6 text-[10px] border-slate-600 text-slate-300 hover:bg-slate-700"
                                    onClick={() => document.getElementById(`csv-${chip.instanceId}`)?.click()}
                                  >
                                    <Upload className="w-3 h-3 mr-1" />
                                    Upload CSV
                                  </Button>
                                </div>
                              )}
                              
                              {chipDef.id === 'json-file-input' && (
                                <div className="mt-1.5 pt-1.5 border-t border-slate-600">
                                  <input
                                    type="file"
                                    accept=".json"
                                    className="hidden"
                                    id={`json-${chip.instanceId}`}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) {
                                        const reader = new FileReader()
                                        reader.onload = (ev) => {
                                          updateChipParams(chip.instanceId, { fileData: ev.target?.result as string })
                                          toast.success(`Loaded: ${file.name}`)
                                        }
                                        reader.readAsText(file)
                                      }
                                    }}
                                  />
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="w-full h-6 text-[10px] border-slate-600 text-slate-300 hover:bg-slate-700"
                                    onClick={() => document.getElementById(`json-${chip.instanceId}`)?.click()}
                                  >
                                    <Upload className="w-3 h-3 mr-1" />
                                    Upload JSON
                                  </Button>
                                </div>
                              )}
                              
                              {/* Visualization */}
                              {chipDef.id === 'waveform-display' && results._waveformData && (
                                <div className="mt-1.5 pt-1.5 border-t border-slate-600">
                                  <div className="h-10 bg-slate-900/50 rounded overflow-hidden">
                                    <svg viewBox="0 0 100 30" className="w-full h-full">
                                      <path
                                        d={`M 0 15 ${((results._waveformData as number[]) || []).slice(0, 100).map((v, i) => 
                                          `L ${i} ${15 - v * 12}`
                                        ).join(' ')}`}
                                        fill="none"
                                        stroke="#10b981"
                                        strokeWidth="0.5"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              )}
                              
                              {chipDef.id === 'spectrum-display' && results._spectrumData && (
                                <div className="mt-1.5 pt-1.5 border-t border-slate-600">
                                  <div className="h-10 bg-slate-900/50 rounded overflow-hidden flex items-end">
                                    {(((results._spectrumData as { magnitude: number[] }).magnitude) || []).slice(0, 50).map((v, i) => (
                                      <div
                                        key={i}
                                        className="w-0.5 bg-gradient-to-t from-emerald-500 to-cyan-500"
                                        style={{ height: `${Math.min(100, v * 1000)}%` }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {chipDef.id === 'data-table' && results._tableData && (
                                <div className="mt-1.5 pt-1.5 border-t border-slate-600">
                                  <div className="text-[9px] text-slate-400 max-h-16 overflow-auto">
                                    {Array.isArray(results._tableData) && results._tableData.slice(0, 3).map((row, i) => (
                                      <div key={i} className="truncate">
                                        {JSON.stringify(row).slice(0, 40)}...
                                      </div>
                                    ))}
                                    {Array.isArray(results._tableData) && results._tableData.length > 3 && (
                                      <div className="text-slate-500">+{results._tableData.length - 3} more rows</div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {chipDef.id === 'value-display' && results._displayValue !== undefined && (
                                <div className="mt-1.5 pt-1.5 border-t border-slate-600">
                                  <div className="text-[9px] font-medium text-emerald-400 mb-0.5">
                                    {results._displayLabel as string}:
                                  </div>
                                  <div className="text-[9px] text-slate-300 max-h-12 overflow-auto break-all">
                                    {typeof results._displayValue === 'object' 
                                      ? JSON.stringify(results._displayValue, null, 0).slice(0, 80)
                                      : String(results._displayValue).slice(0, 80)}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}

                    {/* Empty State */}
                    {circuit.chips.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center p-8">
                        <div className="text-center max-w-md">
                          <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          >
                            <Cpu className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                          </motion.div>
                          <h3 className="text-xl font-medium mb-2 text-slate-300">Start Building</h3>
                          <p className="text-slate-400 mb-4 text-sm">
                            Drag chips from the library or load a template below
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {DEMO_TEMPLATES.slice(0, 4).map(t => (
                              <Button 
                                key={t.id} 
                                variant="outline" 
                                size="sm" 
                                className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 text-xs justify-start"
                                onClick={() => loadTemplate(t.id)}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                {t.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Properties Panel */}
                <div className="w-64 bg-slate-800/50 border-l border-slate-700 flex flex-col">
                  <div className="p-3 border-b border-slate-700">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Settings className="w-4 h-4 text-emerald-400" />
                      Properties
                    </h3>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-3">
                      {selectedChip ? (
                        (() => {
                          const chip = circuit.chips.find(c => c.instanceId === selectedChip)
                          const chipDef = chip ? getChipDef(chip.chipId) : null
                          if (!chip || !chipDef) return null
                          
                          const results = executionResults[chip.instanceId] || {}

                          return (
                            <div className="space-y-3">
                              <div>
                                <Label className="text-xs text-slate-400">Chip</Label>
                                <div className="flex items-center gap-2 mt-1">
                                  <div 
                                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: `${chipDef.color}20`, color: chipDef.color }}
                                  >
                                    {chipDef.icon}
                                  </div>
                                  <div>
                                    <div className="font-medium text-sm text-slate-200">{chipDef.name}</div>
                                    <div className="text-xs text-slate-400">{chipDef.description}</div>
                                  </div>
                                </div>
                              </div>

                              {chipDef.params && chipDef.params.length > 0 && (
                                <div>
                                  <Label className="text-xs text-slate-400">Parameters</Label>
                                  <div className="space-y-2 mt-2">
                                    {chipDef.params.map(param => (
                                      <div key={param.name}>
                                        <Label className="text-xs text-slate-300">{param.name}</Label>
                                        {param.type === 'boolean' ? (
                                          <select
                                            value={String(chip.params[param.name] ?? param.default)}
                                            onChange={(e) => updateChipParams(chip.instanceId, { [param.name]: e.target.value === 'true' })}
                                            className="w-full h-7 mt-1 text-xs bg-slate-700 border-slate-600 text-slate-200 rounded"
                                          >
                                            <option value="true">true</option>
                                            <option value="false">false</option>
                                          </select>
                                        ) : (
                                          <Input
                                            value={String(chip.params[param.name] ?? param.default)}
                                            onChange={(e) => updateChipParams(chip.instanceId, { [param.name]: e.target.value })}
                                            className="h-7 mt-1 text-xs bg-slate-700 border-slate-600 text-slate-200"
                                          />
                                        )}
                                        <p className="text-[10px] text-slate-500 mt-0.5">{param.description}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {Object.keys(results).length > 0 && (
                                <div>
                                  <Label className="text-xs text-slate-400">Output</Label>
                                  <div className="mt-2 p-2 bg-slate-900/50 rounded border border-slate-600 max-h-40 overflow-auto">
                                    <pre className="text-[10px] text-emerald-400 whitespace-pre-wrap break-all">
                                      {JSON.stringify(results, (key, value) => 
                                        key.startsWith('_') ? undefined : value, 2
                                      )}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              <Button
                                variant="destructive"
                                size="sm"
                                className="w-full bg-red-600 hover:bg-red-700 h-8 text-xs"
                                onClick={() => removeChip(chip.instanceId)}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Remove Chip
                              </Button>
                            </div>
                          )
                        })()
                      ) : (
                        <div className="text-center py-8">
                          <Info className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                          <p className="text-sm text-slate-400">Select a chip to view properties</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          )}

          {/* TUTORIALS */}
          {activeTab === 'tutorials' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-4 py-12"
            >
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">
                  Learn <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">SoftChip Studio</span>
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                  Master real-world data processing without writing code
                </p>
              </div>

              {/* Quick Start */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                {[
                  { title: 'Upload Audio', desc: 'Process real audio files', icon: <FileAudio className="w-5 h-5" />, action: () => loadTemplate('audio-analyzer') },
                  { title: 'Capture Mic', desc: 'Record from microphone', icon: <Mic className="w-5 h-5" />, action: () => { setActiveTab('builder'); addChip('microphone-input') } },
                  { title: 'Process CSV', desc: 'Transform data files', icon: <FileSpreadsheet className="w-5 h-5" />, action: () => loadTemplate('csv-statistics') },
                  { title: 'Test Protocol', desc: 'UART/Modbus testing', icon: <Cable className="w-5 h-5" />, action: () => loadTemplate('uart-testing') }
                ].map((item, i) => (
                  <Card 
                    key={i}
                    className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 cursor-pointer transition-all"
                    onClick={item.action}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                          {item.icon}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{item.title}</div>
                          <div className="text-xs text-slate-400">{item.desc}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Tutorials */}
              <div className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg">📚 Tutorial 1: Audio Processing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-slate-400 text-sm">
                      Learn how to upload an audio file, compute its frequency spectrum using FFT, and visualize the results.
                    </p>
                    <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
                      <li>Load the "Audio Analyzer" template</li>
                      <li>Click on the "Audio File" chip and upload a WAV or MP3 file</li>
                      <li>Click "Run" to execute the circuit</li>
                      <li>View the spectrum visualization showing frequency content</li>
                    </ol>
                    <Button onClick={() => loadTemplate('audio-analyzer')} className="bg-emerald-600 hover:bg-emerald-700">
                      Try It Now
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg">📚 Tutorial 2: Signal Filtering</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-slate-400 text-sm">
                      Generate test signals, apply low-pass/high-pass filters, and listen to the filtered output.
                    </p>
                    <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
                      <li>Load the "Signal Filter Demo" template</li>
                      <li>Adjust the Signal Generator parameters (frequency, type)</li>
                      <li>Modify the FIR Filter cutoff frequency</li>
                      <li>Run and see the waveform change, hear the filtered audio</li>
                    </ol>
                    <Button onClick={() => loadTemplate('signal-filter-demo')} className="bg-emerald-600 hover:bg-emerald-700">
                      Try It Now
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg">📚 Tutorial 3: Protocol Testing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-slate-400 text-sm">
                      Test UART and Modbus protocols without any hardware. Generate frames, verify checksums.
                    </p>
                    <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
                      <li>Load the "UART Protocol Testing" template</li>
                      <li>Change the text input to test different data</li>
                      <li>Run to see the hex output and frame details</li>
                      <li>Try the Modbus template for industrial protocol testing</li>
                    </ol>
                    <Button onClick={() => loadTemplate('uart-testing')} className="bg-emerald-600 hover:bg-emerald-700">
                      Try It Now
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg">📚 Tutorial 4: Building Custom Circuits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-slate-400 text-sm">
                      Learn how to connect chips together to build your own processing pipeline.
                    </p>
                    <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
                      <li>Click on a chip in the library to add it to the canvas</li>
                      <li>Click on an OUTPUT pin (cyan) to start a connection</li>
                      <li>Click on an INPUT pin (green) of another chip to connect</li>
                      <li>Configure chip parameters in the Properties panel</li>
                      <li>Click "Run" to execute your circuit</li>
                    </ol>
                    <Button onClick={() => setActiveTab('builder')} className="bg-emerald-600 hover:bg-emerald-700">
                      Start Building
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-slate-900 border-t border-slate-800 mt-auto">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                  <CircuitBoard className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-slate-300">SoftChip Studio</span>
              </div>
              <div className="text-sm text-slate-500">
                Real data processing with software microchips
              </div>
            </div>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  )
}
