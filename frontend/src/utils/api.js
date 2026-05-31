// frontend/src/utils/api.js
import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''

export const api = axios.create({ baseURL: BASE, timeout: 900_000 })

export async function evaluate(conversation, options = {}) {
  const { data } = await api.post('/evaluate', {
    conversation,
    turn_index: options.turnIndex ?? -1,
    facet_categories: options.categories ?? null,
    facet_ids: options.facetIds ?? null,
  })
  return data
}

export async function getFacets(category = null) {
  const params = category ? { category } : {}
  const { data } = await api.get('/facets', { params })
  return data
}

export async function healthCheck() {
  const { data } = await api.get('/health')
  return data
}

// Score helpers
export const SCORE_LABELS = {
  '-2': 'Strongly Absent',
  '-1': 'Mildly Absent',
  '0': 'Neutral',
  '1': 'Mildly Present',
  '2': 'Strongly Present',
}

export const SCORE_COLORS = {
  '-2': '#ef4444',
  '-1': '#f97316',
  '0': '#94a3b8',
  '1': '#22c55e',
  '2': '#10b981',
}

export function scoreColor(score) {
  return SCORE_COLORS[String(score)] ?? '#94a3b8'
}

export function scoreLabel(score) {
  return SCORE_LABELS[String(score)] ?? 'Unknown'
}

export const CATEGORIES = [
  'emotional', 'cognitive', 'linguistic', 'personality',
  'social', 'safety', 'spiritual', 'health', 'behavioral', 'professional', 'general'
]
