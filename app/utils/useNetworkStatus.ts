import { useEffect, useState } from "react"
import NetInfo, { NetInfoState } from "@react-native-community/netinfo"

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(!!state.isConnected)
      if (state.isConnected) {
        setLastUpdate(Date.now())
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return { isConnected, lastUpdate }
}
