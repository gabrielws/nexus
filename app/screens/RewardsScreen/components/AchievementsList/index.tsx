// eslint-disable-next-line no-restricted-imports, @typescript-eslint/no-unused-vars
import React, { FC, useEffect, useState } from "react"
import { View, ViewStyle, TextStyle, FlatList, Dimensions } from "react-native"
import { observer } from "mobx-react-lite"
import { Text, Loading } from "@/components"
import { useStores } from "@/models"
import { spacing } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import type { ThemedStyle } from "@/theme"
import { AchievementCard } from "./AchievementCard"
import { Instance } from "mobx-state-tree"
import { UserStoreModel } from "@/models/UserStore"

type Achievement = Instance<typeof UserStoreModel>["achievements"][0]
type AchievementColumn = Achievement[]
type AchievementPage = AchievementColumn

const ITEMS_PER_COLUMN = 6
const COLUMNS_PER_PAGE = 1
const PAGE_SIZE = ITEMS_PER_COLUMN * COLUMNS_PER_PAGE
const { width: SCREEN_WIDTH } = Dimensions.get("window")
const SECTION_PADDING = spacing.md // Padding padrão das seções

export interface AchievementsListProps {
  scrollEnabled?: boolean
}

export const AchievementsList: FC<AchievementsListProps> = observer(function AchievementsList({
  scrollEnabled = true,
}) {
  const { userStore } = useStores()
  const { themed } = useAppTheme()
  const [inProgressPage, setInProgressPage] = useState(0)
  const [completedPage, setCompletedPage] = useState(0)

  useEffect(() => {
    userStore.updateAchievements()
  }, [userStore])

  // Ordena as conquistas em progresso por porcentagem
  const inProgressAchievements = userStore.achievements
    .filter((a) => !a.completed_at)
    .sort((a, b) => b.progress_percentage - a.progress_percentage)
  const completedAchievements = userStore.achievements
    .filter((a) => a.completed_at)
    .sort((a, b) => (b.completed_at || "").localeCompare(a.completed_at || ""))

  if (userStore.isLoading) {
    return (
      <View style={$loadingContainer}>
        <Loading />
      </View>
    )
  }

  if (userStore.errorMessage) {
    return (
      <View style={$errorContainer}>
        <Text preset="subheading" text={userStore.errorMessage} style={themed($errorText)} />
      </View>
    )
  }

  const createGroups = (items: Achievement[]): AchievementPage[] => {
    const pages: AchievementPage[] = []
    for (let i = 0; i < items.length; i += PAGE_SIZE) {
      const page = items.slice(i, i + PAGE_SIZE)
      pages.push(page)
    }
    return pages
  }

  const renderPage = ({ item: achievements }: { item: AchievementPage }) => (
    <View style={$page}>
      <View style={$column}>
        {achievements.map((achievement) => (
          <View key={achievement.id} style={$cardContainer}>
            <AchievementCard achievement={achievement} />
          </View>
        ))}
      </View>
    </View>
  )

  const renderPaginationDots = (totalPages: number, currentPage: number) => (
    <View style={$paginationContainer}>
      {Array.from({ length: totalPages }).map((_, index) => (
        <View
          key={index}
          style={[
            themed($paginationDot),
            themed(index === currentPage ? $paginationDotActive : $paginationDotInactive),
          ]}
        />
      ))}
    </View>
  )

  const renderSection = (
    title: string,
    achievements: Achievement[],
    currentPage: number,
    setPage: (page: number) => void,
  ) => {
    const pages = createGroups(achievements)

    const handleScroll = (event: any) => {
      const contentOffset = event.nativeEvent.contentOffset.x
      const pageIndex = Math.round(contentOffset / SCREEN_WIDTH)
      setPage(pageIndex)
    }

    return (
      <View style={$section}>
        <Text preset="subheading" text={title} style={themed($sectionTitle)} />
        {achievements.length === 0 ? (
          <Text
            preset="default"
            text={
              title === "Em Progresso"
                ? "Nenhuma conquista em progresso"
                : "Nenhuma conquista concluída"
            }
            style={themed($emptyText)}
          />
        ) : (
          <View>
            <FlatList
              data={pages}
              renderItem={renderPage}
              keyExtractor={(_, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={$listContent}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              scrollEnabled={scrollEnabled}
              pagingEnabled
              style={$flatList}
            />
            {pages.length > 1 && renderPaginationDots(pages.length, currentPage)}
          </View>
        )}
      </View>
    )
  }

  return (
    <View style={$container}>
      <View style={$contentContainer}>
        {renderSection("Em Progresso", inProgressAchievements, inProgressPage, setInProgressPage)}
        {renderSection("Concluídas", completedAchievements, completedPage, setCompletedPage)}
      </View>
    </View>
  )
})

const $container: ViewStyle = {
  flex: 1,
}

const $contentContainer: ViewStyle = {
  flex: 1,
}

const $section: ViewStyle = {
  marginBottom: spacing.lg,
}

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 16,
  textTransform: "uppercase",
  marginBottom: spacing.sm,
})

const $listContent: ViewStyle = {}

const $page: ViewStyle = {
  width: SCREEN_WIDTH - SECTION_PADDING * 2,
  marginHorizontal: SECTION_PADDING,
}

const $column: ViewStyle = {
  flex: 1,
  flexDirection: "column",
}

const $cardContainer: ViewStyle = {
  marginBottom: spacing.sm,
}

const $loadingContainer: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  padding: spacing.lg,
}

const $errorContainer: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  padding: spacing.lg,
}

const $errorText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
  textAlign: "center",
})

const $emptyText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  textAlign: "center",
  marginTop: spacing.xs,
  fontSize: 14,
})

const $paginationContainer: ViewStyle = {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  paddingTop: spacing.sm,
}

const $paginationDot: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: colors.text,
  marginHorizontal: spacing.xxs,
})

const $paginationDotActive: ThemedStyle<ViewStyle> = () => ({
  opacity: 0.8,
})

const $paginationDotInactive: ThemedStyle<ViewStyle> = () => ({
  opacity: 0.2,
})

const $flatList: ViewStyle = {
  width: SCREEN_WIDTH,
  marginLeft: -SECTION_PADDING, // Compensa o padding da seção
}
