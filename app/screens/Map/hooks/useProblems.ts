import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/services/auth/supabase'
import type { BottomSheetModal } from '@gorhom/bottom-sheet'
import type {
  ActionType,
  ProblemCollection,
  ProblemFeature,
  ProblemFormData,
} from '@/types/types'
import { useProfile } from '@/hooks/useProfile'
import { Image } from 'expo-image'
import { urlCache } from '@/utils/hooks/useSignedUrl'
import * as ImageManipulator from 'expo-image-manipulator'
import { addUserAction } from '@/services/api/addUserAction'

interface UseProblemsReturn {
  problems: ProblemCollection | null
  activeMarkers: ProblemCollection | null
  selectedProblem: ProblemFeature | null
  temporaryMarker: [number, number] | null
  selectedPoint: [number, number] | null
  showXPAnimation: boolean
  lastAction: ActionType | null
  handleMapPress: (event: any, isSelectionMode: boolean) => [number, number] | null
  fetchProblems: () => Promise<void>
  addProblem: (problemData: Omit<ProblemFormData, 'location'>) => Promise<void>
  resolveProblem: () => Promise<void>
  selectProblem: (feature: { features: ProblemFeature[] }, bottomSheetRef?: React.RefObject<BottomSheetModal>) => void
  clearTemporaryState: () => void
  clearSelectedProblem: () => void
  deleteProblem: (problemId: string) => Promise<void>
  setTemporaryMarker: (point: [number, number] | null) => void
  setSelectedPoint: (point: [number, number] | null) => void
}

export function useProblems(user?: { id: string }): UseProblemsReturn {
  const [problems, setProblems] = useState<ProblemCollection | null>(null)
  const [selectedProblem, setSelectedProblem] = useState<ProblemFeature | null>(null)
  const [temporaryMarker, setTemporaryMarker] = useState<[number, number] | null>(null)
  const [selectedPoint, setSelectedPoint] = useState<[number, number] | null>(null)
  const [showXPAnimation, setShowXPAnimation] = useState(false)
  const [lastAction, setLastAction] = useState<ActionType | null>(null)

  const { addXP } = useProfile(user?.id)

  const fetchProblems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reported_problems')
        .select('*')

      if (error)
        throw error

      // Pré-carregar URLs assinadas em paralelo
      const signedUrlPromises = data
        .filter(problem => problem.image_url)
        .map(problem =>
          supabase.storage
            .from('problem-images')
            .createSignedUrl(problem.image_url, 3600)
            .then(({ data }) => {
              if (data?.signedUrl) {
                // Pré-carregar a imagem
                Image.prefetch(data.signedUrl)
                // Adicionar ao cache
                urlCache.set(problem.image_url, {
                  url: data.signedUrl,
                  expiry: Date.now() + 3600000,
                })
              }
            }),
        )

      // Executar todas as promessas em paralelo
      await Promise.all(signedUrlPromises)

      // Converte para GeoJSON
      const features: ProblemFeature[] = data.map(problem => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            problem.location.coordinates[0],
            problem.location.coordinates[1],
          ],
        },
        properties: {
          id: problem.id,
          title: problem.title,
          description: problem.description,
          category: problem.category,
          image_url: problem.image_url,
          status: problem.status,
          reporter_id: problem.reporter_id,
          solver_id: problem.solver_id,
          reported_at: problem.reported_at,
          solved_at: problem.solved_at,
          updated_at: problem.updated_at,
        },
      }))

      setProblems({
        type: 'FeatureCollection',
        features,
      })
    }
    catch (error) {
      console.error('Erro ao buscar problemas:', error)
      throw error
    }
  }, [])

  const addProblem = async (problemData: Omit<ProblemFormData, 'location'>) => {
    if (!selectedPoint || !user)
      return

    if (!problemData.title?.trim())
      throw new Error('Título é obrigatório')

    if (!problemData.description?.trim())
      throw new Error('Descrição é obrigatória')

    if (!problemData.category)
      throw new Error('Categoria é obrigatória')

    try {
      let image_url = null

      // Se tiver imagem, faz upload primeiro
      if (problemData.image) {
        // Comprimir imagem antes do upload
        const manipResult = await ImageManipulator.manipulateAsync(
          problemData.image,
          [{ resize: { width: 1024 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
        )

        // Usar a imagem comprimida
        const fileExt = 'jpg'
        const fileName = `${user.id}/${Math.random().toString(36).substring(7)}.${fileExt}`

        // Preparar o arquivo para upload
        const formData = new FormData()
        formData.append('file', {
          uri: manipResult.uri,
          name: fileName.split('/').pop(),
          type: `image/${fileExt}`,
        } as any)

        // Upload da imagem
        const { error: uploadError } = await supabase
          .storage
          .from('problem-images')
          .upload(fileName, formData)

        if (uploadError) {
          console.error('Erro no upload:', uploadError)
          throw uploadError
        }

        image_url = fileName
      }

      // Adiciona o problema
      const { data: _data, error } = await supabase
        .from('reported_problems')
        .insert({
          title: problemData.title,
          description: problemData.description,
          category: problemData.category,
          image_url,
          location: `POINT(${selectedPoint[0]} ${selectedPoint[1]})`,
          reporter_id: user.id,
          status: 'active', // Explicitamente definir o status
        })
        .select()
        .single()

      if (error) {
        console.error('Erro na inserção:', error)
        throw error
      }

      if (!_data) {
        throw new Error('Erro ao criar problema: nenhum dado retornado')
      }

      // Adiciona XP pela ação
      const success = await addUserAction(user.id, 'report_problem', _data.id)

      if (!success)
        throw new Error('Falha ao adicionar XP')

      await fetchProblems()

      setSelectedPoint(null)
      setTemporaryMarker(null)
      setShowXPAnimation(true)
      setLastAction('report_problem')
      setTimeout(() => setShowXPAnimation(false), 2000)
    }
    catch (error) {
      console.error('Erro ao adicionar problema:', error)
      throw error
    }
  }

  const resolveProblem = async () => {
    if (!selectedProblem || !user)
      return

    // Verifica se o usuário atual é o criador do problema
    if (selectedProblem.properties.reporter_id === user.id)
      throw new Error('Usuário não pode resolver seu próprio problema')

    // Verifica status do problema
    if (selectedProblem.properties.status !== 'active')
      throw new Error('Este problema já foi resolvido ou está inválido')

    try {
      const now = new Date().toISOString()

      // Atualiza o problema para resolvido
      const { data: updatedProblem, error: updateError } = await supabase
        .from('reported_problems')
        .update({
          status: 'solved',
          solver_id: user.id,
          solved_at: now,
        })
        .eq('id', selectedProblem.properties.id)
        .eq('status', 'active') // Garante que o status ainda é active
        .select()
        .single()

      if (updateError || !updatedProblem) {
        console.error('Erro ao atualizar problema:', updateError)
        throw new Error('Não foi possível resolver o problema. Tente novamente.')
      }

      // Só adiciona XP se o problema foi atualizado com sucesso
      await addXP('solve_problem', selectedProblem.properties.id)

      // Atualiza a lista de problemas
      await fetchProblems()

      setShowXPAnimation(true)
      setLastAction('solve_problem')
      setTimeout(() => setShowXPAnimation(false), 2000)

      // Limpa o problema selecionado
      setSelectedProblem(null)
    }
    catch (error) {
      console.error('Erro ao resolver problema:', error)
      throw error
    }
  }

  const selectProblem = useCallback((
    feature: { features: ProblemFeature[] },
    bottomSheetRef?: React.RefObject<BottomSheetModal>,
  ) => {
    const problem = feature.features[0]

    // Pré-carregar a URL assinada
    if (problem.properties.image_url) {
      supabase.storage
        .from('problem-images')
        .createSignedUrl(problem.properties.image_url, 3600)
        .then(({ data }) => {
          if (data?.signedUrl) {
            // Pré-carregar a imagem usando expo-image
            Image.prefetch(data.signedUrl)
          }
        })
        .catch(error => console.error('Erro ao pré-carregar imagem:', error))
    }

    setSelectedProblem(problem)
    requestAnimationFrame(() => {
      bottomSheetRef?.current?.present()
    })
  }, [])

  const clearTemporaryState = () => {
    setTemporaryMarker(null)
    setSelectedPoint(null)
  }

  const clearSelectedProblem = useCallback(() => {
    setSelectedProblem(null)
  }, [])

  const deleteProblem = async (problemId: string) => {
    if (!user)
      return

    try {
      const { data: problem, error: fetchError } = await supabase
        .from('reported_problems')
        .select('image_url, reporter_id, status')
        .eq('id', problemId)
        .single()

      if (fetchError)
        throw fetchError

      if (!problem)
        throw new Error('Problema não encontrado')

      if (problem.reporter_id !== user.id)
        throw new Error('Apenas o criador pode deletar o problema')

      if (problem.status !== 'active')
        throw new Error('Apenas problemas ativos podem ser deletados')

      // Se tem imagem, deletar do storage
      if (problem?.image_url) {
        const fileName = `${problem.reporter_id}/${problem.image_url.split('/').pop()}`
        await supabase
          .storage
          .from('problem-images')
          .remove([fileName])
      }

      // Depois deletar o problema
      const { error } = await supabase
        .from('reported_problems')
        .delete()
        .eq('id', problemId)

      if (error)
        throw error

      await fetchProblems()
    }
    catch (error) {
      console.error('Erro ao deletar problema:', error)
      throw new Error(error instanceof Error ? error.message : 'Erro desconhecido ao deletar problema')
    }
  }

  useEffect(() => {
    fetchProblems()
  }, [fetchProblems])

  const handleMapPress = useCallback((_event: any, isSelectionMode: boolean) => {
    if (!isSelectionMode) {
      setSelectedProblem(null)
      setTemporaryMarker(null)
      setSelectedPoint(null)
      return null
    }

    const coordinates = [
      _event.geometry.coordinates[0],
      _event.geometry.coordinates[1],
    ] as [number, number]

    setTemporaryMarker(coordinates)
    setSelectedPoint(coordinates)
    return coordinates
  }, [])

  // Filtra apenas problemas ativos para exibição no mapa
  const activeMarkers = problems
    ? {
        type: 'FeatureCollection',
        features: problems.features.filter(feature => feature.properties.status === 'active'),
      } as ProblemCollection
    : null

  return {
    problems,
    activeMarkers, // Retorna os markers filtrados
    selectedProblem,
    temporaryMarker,
    selectedPoint,
    showXPAnimation,
    lastAction,
    handleMapPress,
    fetchProblems,
    addProblem,
    resolveProblem,
    selectProblem,
    clearTemporaryState,
    clearSelectedProblem,
    deleteProblem,
    setTemporaryMarker,
    setSelectedPoint,
  }
}
