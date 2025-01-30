// app/models/UpvoteStore.ts

import { flow, Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { supabase } from "@/services/auth/supabase"
import { RealtimeChannel } from "@supabase/supabase-js"
import { withSetPropAction } from "@/models/helpers/withSetPropAction"

/**
 * Modelo MST para upvote
 */
const UpvoteModel = types.model("Upvote", {
  id: types.identifier,
  problemId: types.string,
  userId: types.string,
  createdAt: types.string,
})

export const UpvoteStoreModel = types
  .model("UpvoteStore", {
    upvotes: types.array(UpvoteModel),
    isLoading: false,
    errorMessage: types.maybe(types.string),
  })
  .volatile(() => ({
    realtimeChannel: null as RealtimeChannel | null,
  }))
  .actions(withSetPropAction)
  .actions((self) => {
    // --------------------------------------------
    // Upsert e Remove
    // --------------------------------------------
    function upsertUpvote(row: any) {
      const item = {
        id: row.id,
        problemId: row.problem_id,
        userId: row.user_id,
        createdAt: row.created_at,
      }
      const idx = self.upvotes.findIndex((u) => u.id === item.id)
      if (idx >= 0) {
        self.upvotes[idx] = item
      } else {
        self.upvotes.push(item)
      }
    }

    function removeUpvote(id: string) {
      const idx = self.upvotes.findIndex((u) => u.id === id)
      if (idx >= 0) self.upvotes.splice(idx, 1)
    }

    // --------------------------------------------
    // Realtime: applyRealtimeEvent
    // --------------------------------------------
    function applyRealtimeEvent(payload: {
      eventType: "INSERT" | "UPDATE" | "DELETE"
      new?: any
      old?: any
    }) {
      const { eventType, new: newRow, old: oldRow } = payload
      if (__DEV__) {
        console.log(`🔄 [Upvotes] Evento ${eventType}:`, {
          novo: newRow,
          antigo: oldRow,
        })
      }
      switch (eventType) {
        case "INSERT":
        case "UPDATE":
          if (newRow) upsertUpvote(newRow)
          break
        case "DELETE":
          if (oldRow?.id) removeUpvote(oldRow.id)
          break
      }
    }

    // --------------------------------------------
    // Ações de start/stop da Subscrição
    // --------------------------------------------
    const setRealtimeChannel = (channel: RealtimeChannel | null) => {
      self.realtimeChannel = channel
    }

    const startRealtime = flow(function* startRealtime() {
      if (self.realtimeChannel) {
        yield stopRealtime()
      }

      const channel = supabase
        .channel("realtime-problem_upvotes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "problem_upvotes" },
          function (payload) {
            ;(self as any).applyRealtimeEvent(payload as any)
          },
        )

      setRealtimeChannel(channel)

      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Inscrito no realtime de upvotes!")
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Erro no canal de upvotes")
          setRealtimeChannel(null)
        }
      })
    })

    const stopRealtime = flow(function* stopRealtime() {
      if (self.realtimeChannel) {
        try {
          yield self.realtimeChannel.unsubscribe()
        } catch (err) {
          console.error("Erro ao cancelar inscrição do canal de upvotes:", err)
        } finally {
          self.realtimeChannel = null
        }
      }
    })

    // --------------------------------------------
    // CRUD / Lógica
    // --------------------------------------------
    /**
     * Obter upvotes de um problema específico
     */
    const fetchUpvotesByProblem = flow(function* fetchUpvotesByProblem(problemId: string) {
      self.setProp("isLoading", true)
      self.setProp("errorMessage", undefined)
      try {
        const { data, error } = yield supabase
          .from("problem_upvotes")
          .select("*")
          .eq("problem_id", problemId)
        if (error) throw error

        // Remove upvotes antigos desse problema
        self.upvotes = self.upvotes.filter((u) => u.problemId !== problemId) as any
        data.forEach((item: any) => upsertUpvote(item))
      } catch (err: any) {
        self.setProp("errorMessage", err.message)
      } finally {
        self.setProp("isLoading", false)
      }
    })

    /**
     * Dar upvote em um problema.
     * O XP e conquistas são adicionados automaticamente via triggers no Supabase.
     */
    const addUpvote = flow(function* addUpvote(problemId: string) {
      self.setProp("isLoading", true)
      self.setProp("errorMessage", undefined)
      try {
        const {
          data: { user },
        } = yield supabase.auth.getUser()
        if (!user?.id) throw new Error("Usuário não autenticado")

        const { error } = yield supabase.from("problem_upvotes").insert({
          problem_id: problemId,
          user_id: user.id,
        })

        if (error) throw error

        // Não precisa fazer nada após criar, o Realtime vai atualizar o estado
      } catch (err: any) {
        self.setProp("errorMessage", err.message)
        throw err
      } finally {
        self.setProp("isLoading", false)
      }
    })

    /**
     * Remover upvote do próprio usuário
     */
    const removeUpvoteByProblem = flow(function* removeUpvoteByProblem(problemId: string) {
      self.setProp("isLoading", true)
      self.setProp("errorMessage", undefined)
      try {
        const {
          data: { user },
        } = yield supabase.auth.getUser()
        if (!user?.id) throw new Error("Usuário não autenticado")

        const { error } = yield supabase
          .from("problem_upvotes")
          .delete()
          .eq("problem_id", problemId)
          .eq("user_id", user.id)

        if (error) throw error

        // Não precisa fazer nada após deletar, o Realtime vai atualizar o estado
      } catch (err: any) {
        self.setProp("errorMessage", err.message)
        throw err
      } finally {
        self.setProp("isLoading", false)
      }
    })

    /**
     * Busca total de upvotes recebidos em problemas de um usuário
     */
    const fetchReceivedUpvotesCount = flow(function* fetchReceivedUpvotesCount(userId: string) {
      try {
        const { data, error } = yield supabase
          .from("problem_upvotes")
          .select(
            `
            id,
            reported_problems!inner (
              reporter_id
            )
          `,
          )
          .eq("reported_problems.reporter_id", userId)

        if (error) {
          console.error("Erro ao buscar upvotes recebidos:", error)
          return 0
        }

        return data?.length || 0
      } catch (err) {
        console.error("Erro ao buscar upvotes recebidos:", err)
        return 0
      }
    })

    return {
      setRealtimeChannel,
      startRealtime,
      stopRealtime,
      applyRealtimeEvent,
      fetchUpvotesByProblem,
      addUpvote,
      removeUpvoteByProblem,
      fetchReceivedUpvotesCount,
    }
  })
  .views((self) => ({
    /**
     * Total de upvotes dados por um usuário
     */
    getUserUpvotesCount(userId: string) {
      return self.upvotes.filter((u) => u.userId === userId).length
    },

    /**
     * Total de upvotes em um problema específico
     */
    getUpvoteCount(problemId: string) {
      return self.upvotes.filter((u) => u.problemId === problemId).length
    },

    /**
     * Se um usuário específico (ou o atual) deu upvote em um problema
     */
    hasUpvoted(problemId: string, userId?: string) {
      return self.upvotes.some((u) => u.problemId === problemId && u.userId === userId)
    },
  }))

export interface UpvoteStore extends Instance<typeof UpvoteStoreModel> {}
export interface UpvoteStoreSnapshotOut extends SnapshotOut<typeof UpvoteStoreModel> {}
export interface UpvoteStoreSnapshotIn extends SnapshotIn<typeof UpvoteStoreModel> {}
