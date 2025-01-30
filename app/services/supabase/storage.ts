import { supabase } from "../auth/supabase"
import { decode } from "base64-arraybuffer"

// Cache de URLs assinadas
interface SignedUrlCache {
  url: string
  expiresAt: number
}

const urlCache = new Map<string, SignedUrlCache>()

/**
 * Gera uma URL assinada para uma imagem no bucket
 * @param path Caminho da imagem no bucket
 * @param expiresIn Tempo de expiração em segundos (padrão: 1 hora)
 * @returns URL assinada ou undefined em caso de erro
 */
export async function getSignedImageUrl(
  path: string,
  expiresIn = 3600,
): Promise<string | undefined> {
  try {
    // Verifica se existe no cache e não expirou
    const cached = urlCache.get(path)
    const now = Date.now()
    if (cached && cached.expiresAt > now) {
      console.log("📦 URL encontrada no cache:", path)
      return cached.url
    }

    console.log("🔄 Gerando nova URL assinada:", path)
    const { data, error } = await supabase.storage
      .from("problem-images")
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error("❌ Erro ao gerar URL assinada:", error)
      return undefined
    }

    // Salva no cache
    urlCache.set(path, {
      url: data.signedUrl,
      expiresAt: now + expiresIn * 1000, // Converte segundos para milissegundos
    })

    return data.signedUrl
  } catch (error) {
    console.error("❌ Erro ao gerar URL assinada:", error)
    return undefined
  }
}

/**
 * Faz upload de uma imagem para o bucket do Supabase
 * @param uri URI local da imagem
 * @param path Caminho onde a imagem será salva no bucket (ex: "problems/123.jpg")
 * @returns URL pública da imagem ou undefined em caso de erro
 */
export async function uploadImage(uri: string, path: string): Promise<string | undefined> {
  try {
    // Converte URI em blob
    const response = await fetch(uri)
    const blob = await response.blob()

    // Converte blob em base64
    const reader = new FileReader()
    const base64Promise = new Promise<string>((resolve) => {
      reader.onloadend = () => {
        const base64 = reader.result as string
        resolve(base64.split(",")[1]) // Remove o prefixo "data:image/jpeg;base64,"
      }
    })
    reader.readAsDataURL(blob)
    const base64 = await base64Promise

    // Pega o ID do usuário atual
    const userId = supabase.auth.getUser().then((res) => res.data.user?.id)
    if (!userId) {
      throw new Error("Usuário não autenticado")
    }

    // Faz upload para o Supabase na pasta do usuário
    const fullPath = `${await userId}/${path}`
    const { data, error } = await supabase.storage
      .from("problem-images")
      .upload(fullPath, decode(base64), {
        contentType: "image/jpeg",
        upsert: true,
      })

    if (error) {
      console.error("Erro no upload da imagem:", error)
      return undefined
    }

    // Retorna URL assinada
    return getSignedImageUrl(data.path)
  } catch (error) {
    console.error("Erro ao processar imagem:", error)
    return undefined
  }
}
