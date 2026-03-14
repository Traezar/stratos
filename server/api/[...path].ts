import { proxyRequest } from 'h3'

export default defineEventHandler((event) => {
  const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8080'
  const upstream = backendUrl + event.path.replace(/^\/api/, '')
  return proxyRequest(event, upstream)
})
