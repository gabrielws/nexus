// app/models/CommentStore.ts

import { flow, Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { supabase } from "@/services/auth/supabase"
import { RealtimeChannel } from "@supabase/supabase-js"
import { withSetPropAction } from "@/models/helpers/withSetPropAction"

/**
 * Modelo MST para um comentário.
 * Usa a view "problem_comments_with_profiles" para dados completos.
 */
const CommentModel = types.model("Comment", {
  id: types.identifier,
  problemId: types.string,
  userId: types.string,
  comment: types.string,
  createdAt: types.string,
  updatedAt: types.string,
  username: types.maybe(types.string),
  avatarUrl: types.maybeNull(types.string),
})

export const CommentStoreModel = types
  .model("CommentStore", {
    comments: types.array(CommentModel),
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
    function upsertComment(row: any) {
      const item = {
        id: row.id,
        problemId: row.problem_id,
        userId: row.user_id,
        comment: row.comment,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        username: row.username,
        avatarUrl: row.avatar_url,
      }

      const idx = self.comments.findIndex((c) => c.id === item.id)
      if (idx >= 0) {
        self.comments[idx] = item
      } else {
        self.comments.push(item)
      }
    }

    function removeComment(id: string) {
      const idx = self.comments.findIndex((c) => c.id === id)
      if (idx >= 0) self.comments.splice(idx, 1)
    }

    // --------------------------------------------
    // Realtime: applyRealtimeEvent
    // --------------------------------------------
    const applyRealtimeEvent = flow(function* applyRealtimeEvent(payload: {
      eventType: "INSERT" | "UPDATE" | "DELETE"
      new?: any
      old?: any
    }) {
      const { eventType, new: newRow, old: oldRow } = payload
      if (__DEV__) {
        console.log(`🔄 [Comentários] Evento ${eventType}:`, {
          novo: newRow,
          antigo: oldRow,
        })
      }

      // Para INSERT e UPDATE, busca da view para ter os dados completos
      if (eventType === "INSERT" || eventType === "UPDATE") {
        if (newRow?.id) {
          try {
            const { data, error } = yield supabase
              .from("problem_comments_with_profiles")
              .select("*")
              .eq("id", newRow.id)
              .single()

            if (!error && data) {
              upsertComment(data)
            }
          } catch (err) {
            console.error("❌ Erro ao buscar dados completos do comentário:", err)
          }
        }
      } else if (eventType === "DELETE" && oldRow?.id) {
        removeComment(oldRow.id)
      }
    })

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
        .channel("realtime-problem_comments")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "problem_comments" },
          function (payload) {
            ;(self as any).applyRealtimeEvent(payload as any)
          },
        )

      setRealtimeChannel(channel)

      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Inscrito no realtime de comentários!")
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Erro no canal de comentários")
          setRealtimeChannel(null)
        }
      })
    })

    const stopRealtime = flow(function* stopRealtime() {
      if (self.realtimeChannel) {
        try {
          yield self.realtimeChannel.unsubscribe()
        } catch (err) {
          console.error("Erro ao cancelar inscrição do canal de comentários:", err)
        } finally {
          self.realtimeChannel = null
        }
      }
    })

    // --------------------------------------------
    // CRUD
    // --------------------------------------------
    /**
     * Lista comentários de um problema usando a view problem_comments_with_profiles
     */
    const fetchCommentsByProblem = flow(function* fetchCommentsByProblem(problemId: string) {
      self.setProp("isLoading", true)
      self.setProp("errorMessage", undefined)
      try {
        const { data, error } = yield supabase
          .from("problem_comments_with_profiles")
          .select("*")
          .eq("problem_id", problemId)
          .order("created_at", { ascending: true })

        if (error) throw error

        // Limpa comentários antigos desse problema
        self.comments = self.comments.filter((c) => c.problemId !== problemId) as any

        data.forEach((item: any) => upsertComment(item))
      } catch (err: any) {
        self.setProp("errorMessage", err.message)
      } finally {
        self.setProp("isLoading", false)
      }
    })

    /**
     * Cria um novo comentário.
     * O XP é adicionado automaticamente via trigger no Supabase.
     */
    const createComment = flow(function* createComment(problemId: string, text: string) {
      self.setProp("isLoading", true)
      self.setProp("errorMessage", undefined)
      try {
        const {
          data: { user },
        } = yield supabase.auth.getUser()
        if (!user?.id) throw new Error("Usuário não autenticado")

        const { error } = yield supabase.from("problem_comments").insert({
          problem_id: problemId,
          comment: text,
          user_id: user.id,
        })

        if (error) throw error

        // Não precisa fazer nada após criar, o Realtime vai atualizar o estado
      } catch (err: any) {
        console.error("❌ Erro ao criar comentário:", err)
        self.setProp("errorMessage", err.message)
      } finally {
        self.setProp("isLoading", false)
      }
    })

    /**
     * Atualiza texto de um comentário
     */
    const updateComment = flow(function* updateComment(commentId: string, newText: string) {
      self.setProp("isLoading", true)
      self.setProp("errorMessage", undefined)
      try {
        const { error } = yield supabase
          .from("problem_comments")
          .update({ comment: newText })
          .eq("id", commentId)

        if (error) throw error

        // Não precisa fazer nada após atualizar, o Realtime vai atualizar o estado
      } catch (err: any) {
        self.setProp("errorMessage", err.message)
      } finally {
        self.setProp("isLoading", false)
      }
    })

    /**
     * Remove um comentário
     */
    const deleteComment = flow(function* deleteComment(commentId: string) {
      self.setProp("isLoading", true)
      self.setProp("errorMessage", undefined)
      try {
        const { error } = yield supabase.from("problem_comments").delete().eq("id", commentId)

        if (error) throw error

        // Não precisa fazer nada após deletar, o Realtime vai atualizar o estado
      } catch (err: any) {
        self.setProp("errorMessage", err.message)
      } finally {
        self.setProp("isLoading", false)
      }
    })

    return {
      setRealtimeChannel,
      startRealtime,
      stopRealtime,
      applyRealtimeEvent,
      fetchCommentsByProblem,
      createComment,
      updateComment,
      deleteComment,
    }
  })
  .views((self) => ({
    getCommentsByProblem(problemId: string) {
      return self.comments.filter((c) => c.problemId === problemId)
    },
  }))

export interface CommentStore extends Instance<typeof CommentStoreModel> {}
export interface CommentStoreSnapshotOut extends SnapshotOut<typeof CommentStoreModel> {}
export interface CommentStoreSnapshotIn extends SnapshotIn<typeof CommentStoreModel> {}
