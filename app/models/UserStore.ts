// app/models/UserStore.ts

import { flow, Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { withSetPropAction } from "./helpers/withSetPropAction"
import { supabase } from "app/services/auth/supabase"
import { RealtimeChannel } from "@supabase/supabase-js"

const LevelConfigModel = types.model("LevelConfig", {
  level: types.number,
  xp_required: types.number,
  title: types.string,
  description: types.maybeNull(types.string),
  created_at: types.maybeNull(types.string),
})

const AchievementModel = types.model("Achievement", {
  id: types.identifier,
  title: types.string,
  description: types.string,
  icon: types.string,
  xp_reward: types.number,
  category: types.enumeration(["problems", "check_in", "social", "level", "special"]),
  requirement: types.number,
  current_progress: types.optional(types.number, 0),
  progress_percentage: types.optional(types.number, 0),
  completed_at: types.maybeNull(types.string),
})

const UserProfileModel = types.model("UserProfile", {
  id: types.identifier,
  username: types.string,
  avatar_url: types.maybeNull(types.string),
  current_xp: types.number,
  current_level: types.number,
  current_streak: types.number,
  max_streak: types.number,
  last_check_in: types.maybeNull(types.string),
  problems_reported: types.number,
  problems_solved: types.number,
  created_at: types.string,
  updated_at: types.string,
})

export const UserStoreModel = types
  .model("UserStore")
  .props({
    profile: types.maybeNull(UserProfileModel),
    currentLevelConfig: types.maybe(LevelConfigModel),
    nextLevelConfig: types.maybe(LevelConfigModel),
    achievements: types.optional(types.array(AchievementModel), []),
    isLoading: types.optional(types.boolean, false),
    errorMessage: types.maybeNull(types.string),
    rankingUsers: types.optional(types.array(UserProfileModel), []),
  })
  .volatile(() => ({
    isUpdatingAchievements: false,
    achievementsUpdateQueued: false,
    updateAchievementsTimeout: null as NodeJS.Timeout | null,
    realtimeChannel: null as RealtimeChannel | null,
    achievementsChannel: null as RealtimeChannel | null,
  }))
  .actions(withSetPropAction)
  .views((self) => ({
    get id() {
      return self.profile?.id
    },
    /** Retorna as informações do nível atual do usuário */
    get currentLevelInfo() {
      return self.currentLevelConfig
    },

    /** Retorna as informações do próximo nível */
    get nextLevelInfo() {
      return self.nextLevelConfig
    },

    /** Retorna as informações de um nível específico */
    getLevelInfo(level: number) {
      if (level === self.profile?.current_level) return self.currentLevelConfig
      if (level === (self.profile?.current_level ?? 0) + 1) return self.nextLevelConfig
      return null
    },

    /** Percentual de problemas resolvidos = (problems_solved / problems_reported) * 100 */
    get resolutionRate() {
      if (!self.profile) return 0
      if (self.profile.problems_reported === 0) return 0
      return Number(
        ((self.profile.problems_solved / self.profile.problems_reported) * 100).toFixed(1),
      )
    },

    /** Retorna se o usuário pode fazer check-in agora */
    get canCheckIn() {
      if (!self.profile) return false
      if (!self.profile.last_check_in) return true // nunca fez check-in

      const lastCheckInTime = new Date(self.profile.last_check_in).getTime()
      const now = Date.now()
      const hoursSinceLast = (now - lastCheckInTime) / (1000 * 60 * 60)
      return hoursSinceLast >= 24
    },

    /** XP que falta para atingir o próximo nível */
    get xpToNextLevel() {
      if (!self.profile || !self.nextLevelConfig) return 0
      const diff = self.nextLevelConfig.xp_required - self.profile.current_xp
      return diff > 0 ? diff : 0
    },

    /** Percentual de progresso no nível atual em relação ao próximo nível */
    get progressPercentage() {
      if (!self.profile) return 0
      if (!self.nextLevelConfig) return 100 // Nível máximo

      const currentLevelXP = self.currentLevelConfig?.xp_required ?? 0
      const nextLevelXP = self.nextLevelConfig.xp_required
      const currentXP = self.profile.current_xp

      // Se não tivermos as informações de XP dos níveis, retornamos 0%
      if (nextLevelXP === 0 || currentLevelXP === nextLevelXP) return 0

      // Calcula o progresso baseado na diferença entre os níveis
      const xpProgress = currentXP - currentLevelXP
      const xpNeeded = nextLevelXP - currentLevelXP
      const ratio = xpProgress / xpNeeded
      const pct = ratio * 100

      return pct >= 100 ? 100 : Number(pct.toFixed(1))
    },

    /** Retorna todas as conquistas completadas */
    get completedAchievements() {
      return self.achievements.filter((achievement) => achievement.completed_at)
    },

    /** Retorna o total de conquistas completadas */
    get totalCompletedAchievements() {
      return this.completedAchievements.length
    },

    /** Retorna o total de XP ganho com conquistas */
    get totalAchievementsXP() {
      return this.completedAchievements.reduce(
        (sum: number, achievement) => sum + achievement.xp_reward,
        0,
      )
    },

    /** Retorna as conquistas agrupadas por categoria */
    get achievementsByCategory() {
      return {
        problems: self.achievements.filter((achievement) => achievement.category === "problems"),
        checkIn: self.achievements.filter((achievement) => achievement.category === "check_in"),
        social: self.achievements.filter((achievement) => achievement.category === "social"),
        level: self.achievements.filter((achievement) => achievement.category === "level"),
        special: self.achievements.filter((achievement) => achievement.category === "special"),
      }
    },

    /** Retorna as conquistas agrupadas por categoria e ordenadas por progresso */
    get achievementsByCategoryOrderedByProgress() {
      const sortByProgress = (
        a: (typeof self.achievements)[0],
        b: (typeof self.achievements)[0],
      ) => {
        // Conquistas completadas vêm primeiro
        if (a.completed_at && !b.completed_at) return -1
        if (!a.completed_at && b.completed_at) return 1

        // Se ambas estão completas ou incompletas, ordena por progresso
        return b.progress_percentage - a.progress_percentage
      }

      return {
        problems: self.achievements
          .filter((achievement) => achievement.category === "problems")
          .sort(sortByProgress),
        checkIn: self.achievements
          .filter((achievement) => achievement.category === "check_in")
          .sort(sortByProgress),
        social: self.achievements
          .filter((achievement) => achievement.category === "social")
          .sort(sortByProgress),
        level: self.achievements
          .filter((achievement) => achievement.category === "level")
          .sort(sortByProgress),
        special: self.achievements
          .filter((achievement) => achievement.category === "special")
          .sort(sortByProgress),
      }
    },
  }))
  .actions((self) => {
    // Função auxiliar para logging em dev
    function logDev(...args: any[]) {
      if (__DEV__) {
        console.log(...args)
      }
    }

    // Função auxiliar para logging de erros em dev
    function logError(...args: any[]) {
      if (__DEV__) {
        console.error(...args)
      }
    }

    // Função auxiliar para converter o JSON retornado
    function parseProfileJson(jsonData: any) {
      try {
        const p = jsonData
        if (!p) {
          logDev("❌ [UserStore] Dados do perfil vazios")
          return
        }

        const oldLevel = self.profile?.current_level
        const newLevel = p.current_level ?? 1

        self.profile = {
          id: p.id,
          username: p.username,
          avatar_url: p.avatar_url,
          current_xp: p.current_xp ?? 0,
          current_level: newLevel,
          current_streak: p.current_streak ?? 0,
          max_streak: p.max_streak ?? 0,
          last_check_in: p.last_check_in,
          problems_reported: p.problems_reported ?? 0,
          problems_solved: p.problems_solved ?? 0,
          created_at: p.created_at,
          updated_at: p.updated_at,
        }

        // Se o nível mudou ou não temos informações de nível, busca novamente
        if (oldLevel !== newLevel || !self.currentLevelConfig) {
          fetchLevelInfo()
        }

        logDev("✅ [UserStore] Perfil atualizado:", self.profile.username)
      } catch (error) {
        logError("❌ [UserStore] Erro ao fazer parse do perfil:", error)
        throw new Error("Erro ao processar dados do perfil")
      }
    }

    /**
     * Busca as informações de nível atual e próximo nível
     */
    const fetchLevelInfo = flow(function* () {
      if (!self.profile) {
        logDev("❌ [UserStore] Tentativa de buscar níveis sem perfil")
        return
      }

      try {
        logDev("🔄 [UserStore] Buscando informações de nível...")

        // Busca o nível atual
        const { data: currentLevel, error: currentError } = yield supabase
          .from("level_config")
          .select("*")
          .eq("level", self.profile.current_level)
          .single()

        if (currentError) {
          logError("❌ [UserStore] Erro ao buscar nível atual:", currentError)
          throw currentError
        }

        // Busca o próximo nível
        const { data: nextLevel, error: nextError } = yield supabase
          .from("level_config")
          .select("*")
          .eq("level", self.profile.current_level + 1)
          .single()

        // PGRST116 = not found, é esperado para último nível
        if (nextError && nextError.code !== "PGRST116") {
          logError("❌ [UserStore] Erro ao buscar próximo nível:", nextError)
          throw nextError
        }

        // Atualiza os níveis no store
        self.currentLevelConfig = currentLevel
        self.nextLevelConfig = nextLevel || null

        logDev("✅ [UserStore] Informações de nível atualizadas", {
          atual: currentLevel?.level,
          proximo: nextLevel?.level,
        })
      } catch (err: any) {
        logError("❌ [UserStore] Erro ao buscar informações de nível:", err)
        self.setProp("errorMessage", "Erro ao carregar informações de nível")
      }
    })

    // --------------------------------------------
    // Ações de start/stop da Subscrição
    // --------------------------------------------
    const setIsUpdatingAchievements = (value: boolean) => {
      self.isUpdatingAchievements = value
    }

    const setAchievementsUpdateQueued = (value: boolean) => {
      self.achievementsUpdateQueued = value
    }

    const clearUpdateAchievementsTimeout = () => {
      if (self.updateAchievementsTimeout) {
        clearTimeout(self.updateAchievementsTimeout)
        self.updateAchievementsTimeout = null
      }
    }

    const startRealtime = flow(function* startRealtime() {
      try {
        if (!self.profile?.id) {
          throw new Error("Perfil não carregado")
        }

        if (self.realtimeChannel || self.achievementsChannel) {
          yield (self as any).stopRealtime()
        }

        // Inicia canal de perfil
        const profileChannel = supabase.channel("realtime-user-profile").on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_profiles",
            filter: `id=eq.${self.profile.id}`,
          },
          function (payload) {
            console.log("🔄 [UserStore] Recebido evento realtime:", payload)
            ;(self as any).handleRealtimeEvent(payload)
          },
        )

        // Inicia canal de conquistas
        const achievementsChannel = supabase
          .channel("realtime-user-achievements")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "user_achievements",
              filter: `user_id=eq.${self.profile.id}`,
            },
            function (payload) {
              console.log("🔄 [UserStore] Recebido evento de conquista:", payload)
              ;(self as any).handleAchievementsRealtimeEvent(payload)
            },
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "achievements",
            },
            function (payload) {
              console.log("🔄 [UserStore] Recebido evento de achievements:", payload)
              ;(self as any).handleAchievementsRealtimeEvent(payload)
            },
          )

        // Subscreve nos canais
        yield Promise.all([
          new Promise((resolve) => {
            profileChannel.subscribe((status) => {
              if (status === "SUBSCRIBED") {
                console.log("✅ [UserStore] Realtime de perfil conectado")
                resolve(true)
              }
            })
          }),
          new Promise((resolve) => {
            achievementsChannel.subscribe((status) => {
              if (status === "SUBSCRIBED") {
                console.log("✅ [UserStore] Realtime de conquistas conectado")
                resolve(true)
              }
            })
          }),
        ])

        self.realtimeChannel = profileChannel
        self.achievementsChannel = achievementsChannel

        console.log("✅ [UserStore] Realtime iniciado com sucesso")
      } catch (error) {
        console.error("❌ [UserStore] Erro ao iniciar Realtime:", error)
        throw error
      }
    })

    const stopRealtime = flow(function* stopRealtime() {
      try {
        if (self.realtimeChannel) {
          yield self.realtimeChannel.unsubscribe()
          self.realtimeChannel = null
        }
        if (self.achievementsChannel) {
          yield self.achievementsChannel.unsubscribe()
          self.achievementsChannel = null
        }
        console.log("🔴 [UserStore] Realtime desconectado")
      } catch (error) {
        console.error("❌ [UserStore] Erro ao desconectar Realtime:", error)
      }
    })

    /**
     * Carrega o perfil do usuário.
     */
    const fetchUserProfile = flow(function* (userId: string) {
      if (!userId) {
        logError("❌ [UserStore] Tentativa de buscar perfil sem userId")
        return
      }

      self.setProp("isLoading", true)
      self.setProp("errorMessage", undefined)

      try {
        logDev("🔄 [UserStore] Buscando perfil do usuário:", userId)

        const { data, error } = yield supabase
          .from("user_profiles")
          .select("*")
          .eq("id", userId)
          .single()

        if (error) {
          logError("❌ [UserStore] Erro ao buscar perfil:", error)
          self.setProp("errorMessage", "Erro ao carregar perfil")
          return
        }

        parseProfileJson(data)
        yield fetchLevelInfo()
        logDev("✅ [UserStore] Perfil carregado com sucesso")
      } catch (err: any) {
        logError("❌ [UserStore] Erro ao carregar perfil:", err)
        self.setProp("errorMessage", "Erro ao carregar perfil")
      } finally {
        self.setProp("isLoading", false)
      }
    })

    /**
     * Busca o perfil de um usuário específico
     */
    const fetchUserProfileById = flow(function* (userId: string) {
      if (!userId) {
        logError("❌ [UserStore] Tentativa de buscar perfil sem userId")
        return null
      }

      try {
        logDev("🔄 [UserStore] Buscando perfil do usuário:", userId)

        const { data, error } = yield supabase
          .from("user_profiles")
          .select("*")
          .eq("id", userId)
          .single()

        if (error) {
          logError("❌ [UserStore] Erro ao buscar perfil:", error)
          throw error
        }

        logDev("📊 [UserStore] Dados brutos:", data)

        // Processa os dados usando a mesma função do perfil principal
        const processedData = {
          id: data.id,
          username: data.username,
          avatar_url: data.avatar_url,
          current_xp: data.current_xp ?? 0,
          current_level: data.current_level ?? 1,
          current_streak: data.current_streak ?? 0,
          max_streak: data.max_streak ?? 0,
          last_check_in: data.last_check_in,
          problems_reported: data.problems_reported ?? 0,
          problems_solved: data.problems_solved ?? 0,
          created_at: data.created_at,
          updated_at: data.updated_at,
        }

        logDev("✅ [UserStore] Perfil processado:", processedData)
        return processedData
      } catch (err: any) {
        logError("❌ [UserStore] Erro ao carregar perfil:", err)
        throw err
      }
    })

    /**
     * Faz o check-in diário.
     */
    const performDailyCheckIn = flow(function* (userId: string) {
      if (!userId) {
        logError("❌ [UserStore] Tentativa de check-in sem userId")
        return
      }

      self.setProp("errorMessage", undefined)
      logDev("🔄 [UserStore] Realizando check-in diário...")

      try {
        const { error } = yield supabase.rpc("perform_daily_check_in_with_bonus", {
          p_user_id: userId,
        })

        if (error) {
          logError("❌ [UserStore] Erro no check-in:", error)
          self.setProp("errorMessage", "Erro ao realizar check-in")
          return
        }

        // O Realtime vai atualizar o perfil, conquistas e nível
        logDev("✅ [UserStore] Check-in realizado com sucesso")
      } catch (err: any) {
        logError("❌ [UserStore] Erro ao realizar check-in:", err)
        self.setProp("errorMessage", "Erro ao realizar check-in")
      }
    })

    /**
     * Atualiza o perfil (ex.: username, avatarUrl)
     */
    const updateProfile = flow(function* (profileData: any) {
      if (!self.profile?.id) {
        logDev("❌ [UserStore] Tentativa de atualizar perfil sem ID")
        return
      }

      try {
        const { error } = yield supabase
          .from("user_profiles")
          .update(profileData)
          .eq("id", self.profile.id)

        if (error) {
          logError("❌ [UserStore] Erro ao atualizar perfil:", error)
          throw error
        }

        // Removida busca e atualização explícita, Realtime vai atualizar
        logDev("✅ [UserStore] Perfil atualizado com sucesso")
      } catch (error) {
        logError("❌ [UserStore] Erro ao atualizar perfil:", error)
        throw new Error("Erro ao processar dados do perfil")
      }
    })

    // Ação para processar eventos do Realtime
    const handleRealtimeEvent = flow(function* (payload: any) {
      try {
        logDev("🔄 [UserStore] Recebido evento realtime:", payload)

        if (!self.profile?.id) {
          logDev("❌ [UserStore] Tentativa de processar evento Realtime sem perfil")
          return
        }

        const newData = payload.new

        // Atualiza o store com o perfil completo
        parseProfileJson(newData)

        // Se houve mudança de nível, atualiza as informações de nível
        if (newData.current_level !== self.profile.current_level) {
          yield fetchLevelInfo()
        }

        logDev("✅ [UserStore] Perfil atualizado via Realtime")
      } catch (error) {
        logError("❌ [UserStore] Erro ao atualizar perfil via Realtime:", error)
      }
    })

    // Ação para processar eventos do Realtime de conquistas
    const handleAchievementsRealtimeEvent = flow(function* (payload: any) {
      try {
        logDev("🔄 [UserStore] Recebido evento realtime de conquistas:", payload)

        if (!self.profile?.id) {
          logDev("❌ [UserStore] Tentativa de processar evento Realtime sem perfil")
          return
        }

        // Atualiza as conquistas independente do tipo de evento
        yield updateAchievements()

        logDev("✅ [UserStore] Evento de conquistas processado")
      } catch (error) {
        logError("❌ [UserStore] Erro ao processar evento de conquistas:", error)
      }
    })

    const checkEmailExists = flow(function* (email: string) {
      self.setProp("isLoading", true)
      self.setProp("errorMessage", undefined)

      try {
        const {
          data: { user },
        } = yield supabase.auth.getUser()

        // Verifica se é igual ao email atual
        if (email.trim().toUpperCase() === user?.email?.toUpperCase()) {
          return "Novo email deve ser diferente do atual"
        }

        // Verifica se já existe um usuário com este email
        const { data, error } = yield supabase.rpc("check_email_exists", {
          p_email: email.trim(),
        })

        if (error) throw error
        if (data === true) {
          return "Este email já está em uso"
        }

        return null
      } catch (err: any) {
        self.setProp("errorMessage", err.message)
        return "Erro ao verificar email"
      } finally {
        self.setProp("isLoading", false)
      }
    })

    const updateEmail = flow(function* (params: { email: string; password: string }) {
      self.setProp("isLoading", true)
      self.setProp("errorMessage", undefined)

      try {
        const {
          data: { user },
        } = yield supabase.auth.getUser()
        if (!user?.email) throw new Error("Erro ao obter dados do usuário")

        // Verifica a senha atual
        const { error: signInError } = yield supabase.auth.signInWithPassword({
          email: user.email,
          password: params.password,
        })

        if (signInError) throw new Error("Senha incorreta")

        // Atualiza o email
        const { error: updateError } = yield supabase.auth.updateUser({
          email: params.email.trim(),
        })

        if (updateError) throw updateError

        return { success: true }
      } catch (err: any) {
        self.setProp("errorMessage", err.message)
        return { success: false, error: err.message }
      } finally {
        self.setProp("isLoading", false)
      }
    })

    // Funções de debug (apenas em desenvolvimento)
    const resetCheckIn = flow(function* (userId: string) {
      if (!__DEV__) return
      self.setProp("isLoading", true)
      try {
        const { error } = yield supabase
          .from("user_profiles")
          .update({
            last_check_in: null,
            current_streak: 0,
          })
          .eq("id", userId)

        if (error) throw error
        // Removida atualização explícita, Realtime vai atualizar
        logDev("✅ [UserStore] Check-in resetado com sucesso")
      } catch (err: any) {
        self.setProp("errorMessage", err.message)
      } finally {
        self.setProp("isLoading", false)
      }
    })

    const setLastCheckIn = flow(function* (userId: string, date: string) {
      if (!__DEV__) return
      self.setProp("isLoading", true)
      try {
        const { error } = yield supabase
          .from("user_profiles")
          .update({
            last_check_in: date,
          })
          .eq("id", userId)

        if (error) throw error
        // O Realtime vai atualizar o perfil
        logDev("✅ [UserStore] Last check-in atualizado com sucesso")
      } catch (err: any) {
        self.setProp("errorMessage", err.message)
      } finally {
        self.setProp("isLoading", false)
      }
    })

    /**
     * Atualiza as conquistas do usuário
     */
    const updateAchievements = flow(function* updateAchievements() {
      if (!self.profile?.id) {
        logDev("❌ [UserStore] Tentativa de buscar conquistas sem perfil")
        return
      }

      if (self.isUpdatingAchievements) {
        logDev("⚠️ [UserStore] Atualização de conquistas já em andamento")
        return
      }

      try {
        self.isUpdatingAchievements = true

        // Busca todas as conquistas disponíveis
        const { data: allAchievements, error: achievementsError } = yield supabase
          .from("achievements")
          .select("*")
          .order("category", { ascending: true })

        if (achievementsError) {
          logError("❌ [UserStore] Erro ao buscar conquistas disponíveis:", achievementsError)
          return
        }

        logDev("✅ [UserStore] Conquistas disponíveis:", allAchievements?.length)

        // Busca as conquistas do usuário
        const { data: userAchievements, error: userAchievementsError } = yield supabase
          .from("user_achievements")
          .select("*")
          .eq("user_id", self.profile.id)

        if (userAchievementsError) {
          logError("❌ [UserStore] Erro ao buscar conquistas do usuário:", userAchievementsError)
          return
        }

        logDev("✅ [UserStore] Conquistas do usuário:", userAchievements?.length)

        interface Achievement {
          id: string
          title: string
          description: string
          icon: string
          xp_reward: number
          category: string
          requirement: number
        }

        interface UserAchievement {
          achievement_id: string
          current_progress: number
          completed_at: string | null
        }

        // Mapeia as conquistas do usuário por achievement_id
        const userAchievementsMap = new Map<string, UserAchievement>(
          userAchievements.map((ua: UserAchievement) => [ua.achievement_id, ua]),
        )

        logDev("✅ [UserStore] Mapa de conquistas do usuário:", userAchievementsMap.size)

        // Combina as conquistas disponíveis com os dados do usuário
        self.achievements = allAchievements.map((achievement: Achievement) => {
          const userAchievement = userAchievementsMap.get(achievement.id)
          logDev(`🔄 [UserStore] Processando conquista ${achievement.id}:`, {
            title: achievement.title,
            userProgress: userAchievement?.current_progress || 0,
            completed: !!userAchievement?.completed_at,
          })
          return {
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            xp_reward: achievement.xp_reward,
            category: achievement.category,
            requirement: achievement.requirement,
            current_progress: userAchievement?.current_progress || 0,
            progress_percentage: Math.min(
              ((userAchievement?.current_progress || 0) / achievement.requirement) * 100,
              100,
            ),
            completed_at:
              typeof userAchievement?.completed_at === "string"
                ? userAchievement.completed_at
                : null,
          }
        })

        logDev("✅ [UserStore] Total de conquistas após processamento:", self.achievements.length)
      } catch (error) {
        logError("❌ [UserStore] Erro ao atualizar conquistas:", error)
      } finally {
        self.isUpdatingAchievements = false
      }
    })

    const setup = flow(function* setup() {
      try {
        self.isLoading = true

        const {
          data: { user },
        } = yield supabase.auth.getUser()
        if (!user?.id) throw new Error("Usuário não autenticado")

        // Carrega perfil inicial
        yield (self as any).fetchUserProfile(user.id)

        // Carrega informações de nível
        yield (self as any).fetchLevelInfo()

        // Inicia o Realtime após carregar os dados
        yield (self as any).startRealtime()

        console.log("✅ [UserStore] Setup concluído com sucesso")
      } catch (error) {
        console.error("❌ [UserStore] Erro no setup:", error)
        self.errorMessage = "Erro ao carregar dados"
      } finally {
        self.isLoading = false
      }
    })

    /**
     * DEBUG: Adiciona XP ao usuário para testar o Realtime
     * Só funciona em modo desenvolvimento
     */
    const debugAddXP = flow(function* debugAddXP() {
      if (!__DEV__) return
      if (!self.profile?.id) return

      try {
        logDev("🔄 [DEBUG] Adicionando XP...")
        const { error } = yield supabase.rpc("add_user_action", {
          p_user_id: self.profile.id,
          p_action: "daily_check_in",
          p_reference_id: `debug_${Date.now()}`,
        })

        if (error) {
          logError("❌ [DEBUG] Erro ao adicionar XP:", error)
          throw error
        }

        // Removida a atualização explícita do perfil
        // O Realtime vai cuidar da atualização
        logDev("✅ [DEBUG] XP adicionado com sucesso!")
      } catch (error) {
        logError("❌ [DEBUG] Erro ao adicionar XP:", error)
      }
    })

    /**
     * Busca a lista de usuários ordenada por XP para o ranking
     */
    const fetchRanking = flow(function* () {
      try {
        logDev("🔄 [UserStore] Buscando ranking...")

        const { data, error } = yield supabase
          .from("user_profiles")
          .select("*")
          .order("current_xp", { ascending: false })
          .limit(50)

        if (error) {
          logError("❌ [UserStore] Erro ao buscar ranking:", error)
          throw error
        }

        if (data) {
          self.rankingUsers = data
          logDev("✅ [UserStore] Ranking atualizado com", data.length, "usuários")
        }
      } catch (error) {
        logError("❌ [UserStore] Erro ao buscar ranking:", error)
        throw new Error("Erro ao buscar ranking")
      }
    })

    return {
      setIsUpdatingAchievements,
      setAchievementsUpdateQueued,
      clearUpdateAchievementsTimeout,
      startRealtime,
      stopRealtime,
      fetchUserProfile,
      fetchUserProfileById,
      performDailyCheckIn,
      updateProfile,
      checkEmailExists,
      updateEmail,
      resetCheckIn,
      setLastCheckIn,
      fetchLevelInfo,
      handleRealtimeEvent,
      handleAchievementsRealtimeEvent,
      updateAchievements,
      debugAddXP,
      setup,
      fetchRanking,
    }
  })

export interface UserStore extends Instance<typeof UserStoreModel> {}
export interface UserStoreSnapshotOut extends SnapshotOut<typeof UserStoreModel> {}
export interface UserStoreSnapshotIn extends SnapshotIn<typeof UserStoreModel> {}
export const createUserStoreDefaultModel = () =>
  types.optional(UserStoreModel, {
    achievements: [],
  })
