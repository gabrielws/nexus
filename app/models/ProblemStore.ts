import { flow, Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { withSetPropAction } from "@/models/helpers/withSetPropAction"
import { supabase } from "@/services/auth/supabase"
import { RealtimeChannel } from "@supabase/supabase-js"

// Enums para status e categorias de problemas
export enum ProblemStatus {
  Active = "active",
  Solved = "solved",
  Invalid = "invalid",
  Deleted = "deleted",
}

export enum ProblemCategory {
  Infrastructure = "infrastructure",
  Maintenance = "maintenance",
  Security = "security",
  Cleaning = "cleaning",
  Technology = "technology",
  Educational = "educational",
  Social = "social",
  Sustainability = "sustainability",
}

// Interface para pontos geográficos (PostGIS)
export interface GeoPoint {
  type: "Point"
  coordinates: [number, number] // [longitude, latitude]
}

// Modelo do problema
const ProblemModel = types.model("Problem", {
  id: types.identifier,
  title: types.string,
  description: types.string,
  category: types.enumeration("ProblemCategory", [
    "infrastructure",
    "maintenance",
    "security",
    "cleaning",
    "technology",
    "educational",
    "social",
    "sustainability",
  ]),
  location: types.frozen<GeoPoint>(),
  imageUrl: types.maybeNull(types.string),
  status: types.enumeration("ProblemStatus", ["active", "solved", "invalid", "deleted"]),
  reporterId: types.string,
  solverId: types.maybeNull(types.string),
  reportedAt: types.string,
  solvedAt: types.maybeNull(types.string),
  updatedAt: types.string,
})

// Tipos para uso externo
export interface Problem extends Instance<typeof ProblemModel> {}
export interface ProblemSnapshotIn extends SnapshotIn<typeof ProblemModel> {}
export interface ProblemSnapshotOut extends SnapshotOut<typeof ProblemModel> {}

export const ProblemStoreModel = types
  .model("ProblemStore", {
    problems: types.optional(types.array(ProblemModel), []),
    statusFilter: types.optional(
      types.enumeration("StatusFilter", ["all", "active", "solved", "invalid", "deleted"]),
      "all",
    ),
    isLoading: types.optional(types.boolean, false),
    errorMessage: types.maybe(types.string),
  })
  .volatile(() => ({
    realtimeChannel: null as RealtimeChannel | null,
  }))
  .actions(withSetPropAction)
  .views((self) => ({
    // Filtros por status
    get activeProblems() {
      return self.problems.filter((p) => p.status === "active")
    },
    get solvedProblems() {
      return self.problems.filter((p) => p.status === "solved")
    },
    get invalidProblems() {
      return self.problems.filter((p) => p.status === "invalid")
    },

    // Filtros por categoria
    problemsByCategory(category: ProblemCategory) {
      return self.problems.filter((p) => p.category === category)
    },

    // Problemas por usuário
    problemsByUser(userId: string) {
      return self.problems.filter((p) => p.reporterId === userId)
    },

    // Problemas resolvidos por usuário
    solvedByUser(userId: string) {
      return self.problems.filter((p) => p.solverId === userId)
    },

    // Filtros combinados
    filteredProblems(filters: {
      status?: ProblemStatus | "all"
      category?: ProblemCategory
      userId?: string
      isSolver?: boolean
    }) {
      return self.problems.filter((p) => {
        // Filtro de status
        if (filters.status && filters.status !== "all" && p.status !== filters.status) {
          return false
        }

        // Filtro de categoria
        if (filters.category && p.category !== filters.category) {
          return false
        }

        // Filtro de usuário
        if (filters.userId) {
          if (filters.isSolver) {
            if (p.solverId !== filters.userId) return false
          } else {
            if (p.reporterId !== filters.userId) return false
          }
        }

        return true
      })
    },

    // Estatísticas
    get statistics() {
      const total = self.problems.length
      const active = this.activeProblems.length
      const solved = this.solvedProblems.length
      const invalid = this.invalidProblems.length

      return {
        total,
        active,
        solved,
        invalid,
        resolutionRate: total > 0 ? Number(((solved / total) * 100).toFixed(1)) : 0,
      }
    },

    /**
     * Status do canal realtime
     */
    get realtimeStatus() {
      return {
        isConnected: !!self.realtimeChannel,
        channelName: self.realtimeChannel?.topic || null,
      }
    },
  }))
  .actions((self) => {
    // Funções de logging
    function logDev(...args: any[]) {
      if (__DEV__) console.log(...args)
    }

    function logError(...args: any[]) {
      if (__DEV__) console.error(...args)
    }

    // Funções de validação
    function validateProblemData(data: {
      title: string
      description: string
      category: ProblemCategory
      location: GeoPoint
    }) {
      // Validações básicas
      if (!data.title?.trim()) throw new Error("Título é obrigatório")
      if (!data.description?.trim()) throw new Error("Descrição é obrigatória")
      if (!data.location?.coordinates) throw new Error("Localização é obrigatória")

      // Validações de tamanho
      if (data.title.length < 5) throw new Error("Título deve ter pelo menos 5 caracteres")
      if (data.title.length > 100) throw new Error("Título deve ter no máximo 100 caracteres")
      if (data.description.length < 10)
        throw new Error("Descrição deve ter pelo menos 10 caracteres")
      if (data.description.length > 1000)
        throw new Error("Descrição deve ter no máximo 1000 caracteres")

      // Validações de coordenadas
      const [longitude, latitude] = data.location.coordinates
      if (longitude < -180 || longitude > 180) throw new Error("Longitude inválida")
      if (latitude < -90 || latitude > 90) throw new Error("Latitude inválida")

      // Validação de categoria
      if (!Object.values(ProblemCategory).includes(data.category)) {
        throw new Error("Categoria inválida")
      }
    }

    function canInvalidateProblem(problem: Problem, userId: string) {
      if (!problem) throw new Error("Problema não encontrado")
      if (!userId) throw new Error("Usuário não identificado")

      if (problem.status !== "active") {
        throw new Error("Apenas problemas ativos podem ser invalidados")
      }
      // Apenas o criador pode invalidar
      if (problem.reporterId !== userId) {
        throw new Error("Apenas quem reportou pode invalidar o problema")
      }
    }

    function canDeleteProblem(problem: Problem, userId: string) {
      if (!problem) throw new Error("Problema não encontrado")
      if (!userId) throw new Error("Usuário não identificado")

      if (problem.status === "deleted") {
        throw new Error("Este problema já foi deletado")
      }
      // Apenas o criador pode deletar
      if (problem.reporterId !== userId) {
        throw new Error("Apenas quem reportou pode deletar o problema")
      }
    }

    // Função de parse do problema
    function parseProblemJson(data: any) {
      try {
        return {
          id: data.id,
          title: data.title,
          description: data.description,
          category: data.category,
          location: data.location,
          imageUrl: data.image_url,
          status: data.status,
          reporterId: data.reporter_id,
          solverId: data.solver_id,
          reportedAt: data.reported_at,
          solvedAt: data.solved_at,
          updatedAt: data.updated_at,
        }
      } catch (error) {
        logError("❌ Erro ao fazer parse do problema:", error)
        throw new Error("Erro ao processar dados do problema")
      }
    }

    // Funções internas para inserir/atualizar/remover
    function upsertProblem(newData: any) {
      try {
        const problem = parseProblemJson(newData)
        const index = self.problems.findIndex((p) => p.id === problem.id)
        if (index >= 0) {
          self.problems[index] = problem as any
        } else {
          self.problems.push(problem as any)
        }
        logDev("✅ Problema atualizado/inserido:", problem.id)
      } catch (error) {
        logError("❌ Erro ao atualizar/inserir problema:", error)
      }
    }

    function removeProblem(id: string) {
      const index = self.problems.findIndex((p) => p.id === id)
      if (index >= 0) {
        self.problems.splice(index, 1)
        logDev("✅ Problema removido:", id)
      }
    }

    // Realtime
    const applyRealtimeEvent = flow(function* (payload: {
      eventType: "INSERT" | "UPDATE" | "DELETE"
      new?: any
      old?: any
      errors: any[] | null
    }) {
      if (payload.errors) {
        logError("❌ Erro no evento realtime:", payload.errors)
        return
      }

      const { eventType, new: newRow, old: oldRow } = payload
      logDev(`🔄 [Problemas] Evento ${eventType}:`, { novo: newRow, antigo: oldRow })

      switch (eventType) {
        case "INSERT":
        case "UPDATE":
          if (newRow) {
            upsertProblem(newRow)
          }
          break
        case "DELETE":
          if (oldRow?.id) {
            removeProblem(oldRow.id)
          }
          break
      }
    })

    const setRealtimeChannel = (channel: RealtimeChannel | null) => {
      self.realtimeChannel = channel
    }

    const startRealtime = flow(function* () {
      logDev("🔄 Iniciando Realtime para problemas...")
      if (self.realtimeChannel) {
        yield stopRealtime()
      }

      const channel = supabase
        .channel("realtime-reported_problems")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "reported_problems" },
          function (payload: {
            eventType: "INSERT" | "UPDATE" | "DELETE"
            new?: any
            old?: any
            errors: any[] | null
          }) {
            ;(self as any).applyRealtimeEvent(payload)
          },
        )

      setRealtimeChannel(channel)

      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          logDev("✅ Subscribed to reported_problems realtime!")
        } else if (status === "CHANNEL_ERROR") {
          logError("❌ Erro na subscrição do canal")
          setRealtimeChannel(null)
        } else if (status === "TIMED_OUT") {
          logError("❌ Timeout na subscrição do canal")
          setRealtimeChannel(null)
        } else if (status === "CLOSED") {
          logDev("🔄 Canal fechado")
          setRealtimeChannel(null)
        }
      })
    })

    const stopRealtime = flow(function* () {
      if (self.realtimeChannel) {
        try {
          yield self.realtimeChannel.unsubscribe()
          logDev("✅ Desconectado do realtime de problemas")
        } catch (error) {
          logError("❌ Erro ao desinscrever do canal:", error)
        } finally {
          self.realtimeChannel = null
        }
      }
    })

    // Ações principais
    const fetchProblems = flow(function* (status?: string) {
      logDev("🔄 Buscando problemas...")
      self.setProp("isLoading", true)
      self.setProp("errorMessage", undefined)
      try {
        let query = supabase
          .from("reported_problems")
          .select("*")
          .order("reported_at", { ascending: false })

        const statusToUse = status || (self.statusFilter !== "all" ? self.statusFilter : null)
        if (statusToUse && statusToUse !== "all") {
          query = query.eq("status", statusToUse)
        } else {
          query = query.neq("status", "deleted")
        }

        const { data, error } = yield query
        if (error) throw error

        self.problems.clear()
        data?.forEach((item: ProblemSnapshotIn) => upsertProblem(item))
        logDev("✅ Problemas carregados:", data?.length)
      } catch (error: any) {
        logError("❌ Erro ao buscar problemas:", error)
        self.setProp("errorMessage", error.message)
      } finally {
        self.setProp("isLoading", false)
      }
    })

    const reportProblem = flow(function* (payload: {
      title: string
      description: string
      category: ProblemCategory
      location: GeoPoint
      imageUrl?: string
      userId: string
    }) {
      logDev("🔄 Reportando problema:", payload)
      self.setProp("isLoading", true)
      self.setProp("errorMessage", undefined)
      try {
        // Validar dados antes de enviar
        validateProblemData({
          title: payload.title,
          description: payload.description,
          category: payload.category,
          location: payload.location,
        })

        const { data, error } = yield supabase
          .from("reported_problems")
          .insert({
            title: payload.title.trim(),
            description: payload.description.trim(),
            category: payload.category,
            location: payload.location,
            image_url: payload.imageUrl,
            reporter_id: payload.userId,
          })
          .select()
          .single()

        if (error) throw error

        // Registra a ação para atualizar os contadores e XP
        const { error: actionError } = yield supabase.rpc("add_user_action", {
          p_user_id: payload.userId,
          p_action: "report_problem",
          p_reference_id: data.id,
        })

        if (actionError) {
          logError("❌ Erro ao registrar ação:", actionError)
          throw actionError
        }

        logDev("✅ Problema reportado com sucesso")
      } catch (error: any) {
        logError("❌ Erro ao reportar problema:", error)
        self.setProp("errorMessage", error.message)
        throw error
      } finally {
        self.setProp("isLoading", false)
      }
    })

    /**
     * Resolve um problema
     * @param problemId ID do problema a ser resolvido
     * @param userId ID do usuário que está resolvendo
     * @throws {Error} Se o problema não puder ser resolvido
     */
    const solveProblem = flow(function* (problemId: string, userId: string) {
      logDev("🔄 [solveProblem] Iniciando...", { problemId, userId })
      try {
        self.setProp("isLoading", true)
        self.setProp("errorMessage", undefined)

        // Chama a função solve_problem do Supabase
        logDev("🔄 [solveProblem] Chamando função solve_problem...")
        const { data, error } = yield supabase.rpc("solve_problem", {
          p_problem_id: problemId,
        })

        if (error) {
          logError("❌ [solveProblem] Erro:", error)
          throw new Error(error.message)
        }

        if (!data) {
          throw new Error("Não foi possível resolver o problema")
        }

        // Atualiza o estado local
        upsertProblem(data)

        logDev("✅ [solveProblem] Problema resolvido com sucesso:", data)
        return data
      } catch (error: any) {
        logError("❌ [solveProblem] Erro:", error)
        self.setProp("errorMessage", error.message)
        throw error
      } finally {
        self.setProp("isLoading", false)
        logDev("🔄 [solveProblem] Finalizado")
      }
    })

    const invalidateProblem = flow(function* (problemId: string, userId: string) {
      logDev("🔄 Invalidando problema:", problemId)
      self.setProp("isLoading", true)
      self.setProp("errorMessage", undefined)
      try {
        const problem = self.problems.find((p) => p.id === problemId)
        if (!problem) throw new Error("Problema não encontrado")

        // Validar permissão antes de invalidar
        canInvalidateProblem(problem, userId)

        const { error } = yield supabase
          .from("reported_problems")
          .update({
            status: "invalid",
          })
          .eq("id", problemId)

        if (error) throw error
        logDev("✅ Problema invalidado com sucesso")
      } catch (error: any) {
        logError("❌ Erro ao invalidar problema:", error)
        self.setProp("errorMessage", error.message)
        throw error
      } finally {
        self.setProp("isLoading", false)
      }
    })

    const deleteProblem = flow(function* (problemId: string, userId: string) {
      logDev("🔄 Deletando problema:", problemId)
      self.setProp("isLoading", true)
      self.setProp("errorMessage", undefined)
      try {
        const problem = self.problems.find((p) => p.id === problemId)
        if (!problem) throw new Error("Problema não encontrado")

        // Validar permissão antes de deletar
        canDeleteProblem(problem, userId)

        const { error } = yield supabase
          .from("reported_problems")
          .update({
            status: "deleted",
          })
          .eq("id", problemId)

        if (error) throw error
        logDev("✅ Problema deletado com sucesso")
      } catch (error: any) {
        logError("❌ Erro ao deletar problema:", error)
        self.setProp("errorMessage", error.message)
        throw error
      } finally {
        self.setProp("isLoading", false)
      }
    })

    /**
     * Reabre um problema que estava resolvido ou invalidado
     * @param problemId ID do problema a ser reaberto
     * @param userId ID do usuário que está reabrindo o problema
     * @throws {Error} Se o problema não puder ser reaberto
     */
    const reopenProblem = flow(function* (problemId: string, userId: string) {
      logDev("🔄 [reopenProblem] Iniciando...", { problemId, userId })
      try {
        self.setProp("isLoading", true)
        self.setProp("errorMessage", undefined)
        // Chama a função reopen_problem do Supabase
        logDev("🔄 [reopenProblem] Chamando função reopen_problem...")
        const { data, error } = yield supabase.rpc("reopen_problem", {
          p_problem_id: problemId,
          p_user_id: userId,
        })
        if (error) {
          logError("❌ [reopenProblem] Erro:", error)
          throw new Error(error.message)
        }
        if (!data) {
          throw new Error("Não foi possível reabrir o problema")
        }
        // Atualiza o estado local
        upsertProblem(data)
        logDev("✅ [reopenProblem] Problema reaberto com sucesso:", data)
        return data
      } catch (error: any) {
        logError("❌ [reopenProblem] Erro:", error)
        self.setProp("errorMessage", error.message)
        throw error
      } finally {
        self.setProp("isLoading", false)
        logDev("🔄 [reopenProblem] Finalizado")
      }
    })

    return {
      // Realtime
      applyRealtimeEvent,
      startRealtime,
      stopRealtime,
      // Ações principais
      fetchProblems,
      reportProblem,
      solveProblem,
      invalidateProblem,
      deleteProblem,
      reopenProblem,
      // Setters
      setProp: self.setProp,
    }
  })
  // E as "views" podem vir depois:
  .views((self) => ({
    get filteredProblems() {
      if (self.statusFilter === "all") return self.problems
      return self.problems.filter((p) => p.status === self.statusFilter)
    },
    get isRealtimeEnabled() {
      return !!self.realtimeChannel
    },
    /**
     * Converte os problemas em GeoJSON para exibição no mapa
     */
    get problemsAsGeoJson() {
      return {
        type: "FeatureCollection",
        features: self.problems
          .filter((p) => p.status !== "deleted") // Não exibe problemas deletados
          .map((problem) => ({
            type: "Feature",
            geometry: problem.location,
            properties: {
              id: problem.id,
              title: problem.title,
              category: problem.category,
              status: problem.status,
              imageUrl: problem.imageUrl,
            },
          })),
      } as const
    },
  }))

export interface ProblemStore extends Instance<typeof ProblemStoreModel> {}
export interface ProblemStoreSnapshotOut extends SnapshotOut<typeof ProblemStoreModel> {}
export interface ProblemStoreSnapshotIn extends SnapshotIn<typeof ProblemStoreModel> {}

// Cria um modelo padrão para o ProblemStore
export const createProblemStoreDefaultModel = () =>
  types.optional(ProblemStoreModel, {
    problems: [],
    statusFilter: "all",
    isLoading: false,
  })
