import { useEffect, useState } from 'react'
import { supabase } from '@/services/auth/supabase'
import { Image } from 'expo-image'

// Cache de URLs assinadas
export const urlCache = new Map<string, { url: string, expiry: number }>()

export function useSignedUrl(path: string | null | undefined) {
  const [signedUrl, setSignedUrl] = useState<string>()

  useEffect(() => {
    const getSignedUrl = async () => {
      if (!path)
        return

      try {
        // Verificar cache primeiro
        const cached = urlCache.get(path)
        if (cached && cached.expiry > Date.now()) {
          setSignedUrl(cached.url)
          return
        }

        const { data, error } = await supabase
          .storage
          .from('problem-images')
          .createSignedUrl(path, 3600)

        if (error)
          throw error

        if (data?.signedUrl) {
          // Pré-carregar a imagem
          await Image.prefetch(data.signedUrl)

          // Guardar no cache por 1 hora
          urlCache.set(path, {
            url: data.signedUrl,
            expiry: Date.now() + 3600000, // 1 hora
          })
          setSignedUrl(data.signedUrl)
        }
      }
      catch (error) {
        console.error('Erro ao gerar URL assinada:', error)
        setSignedUrl(undefined)
      }
    }

    getSignedUrl()
  }, [path])

  return signedUrl
}

export function clearUrlCache(path?: string) {
  if (path)
    urlCache.delete(path)
  else
    urlCache.clear()
}
