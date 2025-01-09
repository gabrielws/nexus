import { useCallback, useEffect, useState } from 'react'
import type { FC } from 'react'
import { observer } from 'mobx-react-lite'
import { FlatList, Image, RefreshControl, View } from 'react-native'
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native'
import type { AppStackScreenProps } from '@/navigators'
import { Header, Screen, Text } from '@/components'
import { useAuth } from '@/services/auth/useAuth'
import { useAppTheme } from '@/utils/useAppTheme'
import { colors, spacing } from '@/theme'
import { useProfile } from '@/hooks/useProfile'

interface ScoreboardScreenProps extends AppStackScreenProps<'Scoreboard'> {}

// Dados mockados
const MOCK_USERS = [
  {
    id: '1',
    name: 'João Silva',
    avatar: 'https://i.pravatar.cc/150?img=1',
    level: 15,
    xp: 7500,
  },
  {
    id: '2',
    name: 'Maria Santos',
    avatar: 'https://i.pravatar.cc/150?img=5',
    level: 14,
    xp: 6800,
  },
  {
    id: '3',
    name: 'Carlos Oliveira',
    avatar: 'https://i.pravatar.cc/150?img=3',
    level: 13,
    xp: 6200,
  },
  {
    id: '4',
    name: 'Ana Costa',
    avatar: 'https://i.pravatar.cc/150?img=4',
    level: 12,
    xp: 5500,
  },
  {
    id: '5',
    name: 'Pedro Souza',
    avatar: 'https://i.pravatar.cc/150?img=7',
    level: 11,
    xp: 4800,
  },
  {
    id: '6',
    name: 'Lucia Ferreira',
    avatar: 'https://i.pravatar.cc/150?img=9',
    level: 10,
    xp: 4200,
  },
  {
    id: '7',
    name: 'Roberto Alves',
    avatar: 'https://i.pravatar.cc/150?img=12',
    level: 9,
    xp: 3600,
  },
  {
    id: '8',
    name: 'Fernanda Lima',
    avatar: 'https://i.pravatar.cc/150?img=11',
    level: 8,
    xp: 3000,
  },
  {
    id: '9',
    name: 'Gabriel Santos',
    avatar: 'https://i.pravatar.cc/150?img=13',
    level: 7,
    xp: 2400,
  },
  {
    id: '10',
    name: 'Mariana Costa',
    avatar: 'https://i.pravatar.cc/150?img=14',
    level: 6,
    xp: 1800,
  },
  {
    id: '11',
    name: 'Ricardo Nunes',
    avatar: 'https://i.pravatar.cc/150?img=15',
    level: 5,
    xp: 1500,
  },
  {
    id: '12',
    name: 'Patricia Silva',
    avatar: 'https://i.pravatar.cc/150?img=16',
    level: 4,
    xp: 1200,
  },
  {
    id: '13',
    name: 'Bruno Oliveira',
    avatar: 'https://i.pravatar.cc/150?img=17',
    level: 3,
    xp: 900,
  },
  {
    id: '14',
    name: 'Camila Rocha',
    avatar: 'https://i.pravatar.cc/150?img=18',
    level: 2,
    xp: 600,
  },
  {
    id: '15',
    name: 'Diego Martins',
    avatar: 'https://i.pravatar.cc/150?img=19',
    level: 1,
    xp: 300,
  },
]

export const ScoreboardScreen: FC<ScoreboardScreenProps> = observer(() => {
  const { user } = useAuth()
  const { profile, refetchProfile } = useProfile(user?.id)
  const { theme: { colors } } = useAppTheme()
  const [refreshing, setRefreshing] = useState(false)
  const [users, setUsers] = useState(MOCK_USERS)

  useEffect(() => {
    if (profile) {
      const updatedUsers = [...MOCK_USERS]
      // Substitui um usuário existente ou adiciona o usuário atual
      const currentUser = {
        id: profile.id,
        name: profile.username,
        avatar: profile.avatar_url || 'https://i.pravatar.cc/150?img=3',
        level: profile.current_level,
        xp: profile.current_xp,
      }

      const existingIndex = updatedUsers.findIndex(u => u.id === profile.id)
      if (existingIndex >= 0) {
        updatedUsers[existingIndex] = currentUser
      }
      else {
        updatedUsers.push(currentUser)
      }

      // Ordena por XP
      const sortedUsers = updatedUsers.sort((a, b) => b.xp - a.xp)
      setUsers(sortedUsers)
    }
  }, [profile])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refetchProfile()
    }
    finally {
      setRefreshing(false)
    }
  }, [refetchProfile])

  const renderItem = ({ item, index }) => {
    const isCurrentUser = item.id === profile?.id
    const isTopThree = index < 3

    return (
      <View style={[
        $itemContainer,
        isCurrentUser && {
          backgroundColor: colors.palette.neutral200,
          borderColor: colors.tint,
          borderWidth: 2,
          padding: spacing.md,
          transform: [{ scale: 1.02 }],
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 4,
        },
      ]}
      >
        <Text style={[
          $position,
          isCurrentUser && { color: colors.tint },
          isTopThree && { fontSize: 18, color: colors.tint },
        ]}
        >
          {index + 1}
          º
        </Text>
        <Image
          source={{ uri: item.avatar }}
          style={[
            $avatar,
            isTopThree && { width: 48, height: 48, borderRadius: 24 },
          ]}
        />
        <View style={$userInfo}>
          <Text style={[
            $name,
            isCurrentUser && { color: colors.tint },
            isTopThree && { fontSize: 18 },
          ]}
          >
            {item.name}
          </Text>
          <Text style={$level}>
            Nível
            {' '}
            {item.level}
          </Text>
        </View>
        <View style={$xpContainer}>
          <Text style={[
            $xp,
            isCurrentUser && { color: colors.tint },
            isTopThree && { fontSize: 16 },
          ]}
          >
            {item.xp}
            {' '}
            XP
          </Text>
        </View>
      </View>
    )
  }

  return (
    <Screen
      style={$root}
      preset="fixed"
      safeAreaEdges={['top']}
      contentContainerStyle={$screenContentContainer}
    >
      <Header
        title="Ranking"
        titleMode="center"
        backgroundColor={colors.background}
        containerStyle={$headerContainer}
      />

      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={$listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.tint]}
            tintColor={colors.tint}
          />
        )}
      />
    </Screen>
  )
})

// Estilos atualizados
const $root: ViewStyle = {
  flex: 1,
  backgroundColor: colors.background,
}

const $screenContentContainer: ViewStyle = {
  flex: 1,
}

const $headerContainer: ViewStyle = {
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
}

const $listContent: ViewStyle = {
  padding: spacing.md,
  paddingBottom: spacing.xl,
}

const $itemContainer: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  padding: spacing.sm,
  marginBottom: spacing.sm,
  borderRadius: 12,
  backgroundColor: colors.background,
  shadowColor: colors.background,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
  borderWidth: 1,
  borderColor: colors.separator,
}

const $position: TextStyle = {
  fontSize: 16,
  fontWeight: 'bold',
  width: 40,
  color: colors.text,
}

const $avatar: ImageStyle = {
  width: 40,
  height: 40,
  borderRadius: 20,
  marginRight: spacing.sm,
}

const $userInfo: ViewStyle = {
  flex: 1,
}

const $name: TextStyle = {
  fontSize: 16,
  fontWeight: 'bold',
  color: colors.text,
}

const $level: TextStyle = {
  fontSize: 14,
  color: colors.textDim,
  marginTop: 2,
}

const $xpContainer: ViewStyle = {
  minWidth: 80,
  alignItems: 'flex-end',
}

const $xp: TextStyle = {
  fontSize: 14,
  fontWeight: 'bold',
  color: colors.textDim,
}
