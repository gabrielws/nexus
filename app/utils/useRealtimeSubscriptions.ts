import { useEffect, useRef, useState } from "react"
import { useStores } from "@/models"
import { useNetworkStatus } from "./useNetworkStatus"
import { useAuth } from "@/services/auth/useAuth"

interface RealtimeStore {
  startRealtime: () => void
  stopRealtime: () => void
}

export function useRealtimeSubscriptions() {
  const { problemStore, commentStore, upvoteStore, userStore } = useStores()
  const { session } = useAuth()
  const { isConnected } = useNetworkStatus()
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const isSetupRef = useRef(false)
  const profileRetryTimeoutRef = useRef<NodeJS.Timeout>()
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 5

  // Função para inicializar as subscrições
  const setupSubscriptions = async () => {
    if (!session?.user?.id || isSetupRef.current) return
    console.log("🟡 Iniciando subscrições realtime...", { tentativa: retryCount + 1 })

    // Aguarda o setup do UserStore primeiro
    if (!userStore.profile) {
      await userStore.setup()
    }

    const stores: RealtimeStore[] = [
      problemStore as RealtimeStore,
      commentStore as RealtimeStore,
      upvoteStore as RealtimeStore,
      userStore as RealtimeStore,
    ]

    try {
      for (const store of stores) {
        if (store.startRealtime) {
          store.startRealtime()
        }
      }
      isSetupRef.current = true
      setRetryCount(0) // Reset contador ao sucesso
      console.log("✅ Subscrições realtime iniciadas com sucesso")
    } catch (err) {
      console.error("❌ Erro ao iniciar realtime:", err)
      isSetupRef.current = false

      if (retryCount < MAX_RETRIES) {
        setRetryCount((prev) => prev + 1)
        scheduleReconnect(true)
      } else {
        console.log("⚠️ Máximo de tentativas de reconexão atingido")
      }
    }
  }

  // Função para limpar as subscrições
  const cleanupSubscriptions = async (reason?: string) => {
    if (!isSetupRef.current) return
    console.log("🟡 Limpando subscrições realtime...", reason ? `Motivo: ${reason}` : "")

    // Limpa timeout de retry do perfil
    if (profileRetryTimeoutRef.current) {
      clearTimeout(profileRetryTimeoutRef.current)
      profileRetryTimeoutRef.current = undefined
    }

    const stores: RealtimeStore[] = [
      problemStore as RealtimeStore,
      commentStore as RealtimeStore,
      upvoteStore as RealtimeStore,
      userStore as RealtimeStore,
    ]

    try {
      for (const store of stores) {
        if (store.stopRealtime) {
          store.stopRealtime()
        }
      }
    } catch (err) {
      console.error("❌ Erro ao limpar realtime:", err)
    } finally {
      isSetupRef.current = false
    }
  }

  // Função para agendar reconexão
  const scheduleReconnect = (isRetry = false) => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    // Tempo de espera aumenta com as tentativas
    const delay = isRetry ? Math.min(1000 * Math.pow(2, retryCount), 30000) : 5000

    reconnectTimeoutRef.current = setTimeout(() => {
      if (isConnected && !isSetupRef.current && retryCount < MAX_RETRIES) {
        console.log("🔄 Tentando reconectar realtime...", {
          tentativa: retryCount + 1,
          delay: `${delay}ms`,
        })
        setupSubscriptions()
      }
    }, delay)
  }

  // Efeito único para gerenciar todo o ciclo de vida das subscrições
  useEffect(() => {
    let isMounted = true

    const initialize = async () => {
      if (!session?.user?.id) {
        console.log("🔴 Realtime não iniciado: usuário não autenticado")
        return
      }

      if (!isConnected) {
        console.log("📡 Sem conexão, aguardando...")
        await cleanupSubscriptions("sem conexão")
        return
      }

      if (!isSetupRef.current && isMounted) {
        await setupSubscriptions()
      }
    }

    initialize()

    // Cleanup quando o componente desmontar ou as dependências mudarem
    return () => {
      isMounted = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (profileRetryTimeoutRef.current) {
        clearTimeout(profileRetryTimeoutRef.current)
      }
      cleanupSubscriptions("desmontagem ou mudança de deps")
    }
  }, [session?.user?.id, isConnected])
}
