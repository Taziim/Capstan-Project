import { useEffect, useRef, useState } from 'react'
import type { Socket } from 'socket.io-client'
import { connectSocket, disconnectSocket, getSocket } from '../services/socket'
import type { ConnectionState } from '../types/chat'

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting')

  useEffect(() => {
    const socket = connectSocket()
    socketRef.current = socket

    const handleConnect = () => setConnectionState('connected')
    const handleDisconnect = () => setConnectionState('disconnected')
    const handleReconnectAttempt = () => setConnectionState('reconnecting')
    const handleReconnect = () => setConnectionState('connected')
    const handleConnectError = () => setConnectionState('reconnecting')

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.io.on('reconnect_attempt', handleReconnectAttempt)
    socket.io.on('reconnect', handleReconnect)
    socket.on('connect_error', handleConnectError)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.io.off('reconnect_attempt', handleReconnectAttempt)
      socket.io.off('reconnect', handleReconnect)
      socket.off('connect_error', handleConnectError)
      disconnectSocket()
    }
  }, [])

  return { socket: getSocket(), connectionState }
}
