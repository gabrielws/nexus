import { type FC } from "react"
import { View, Modal, ViewStyle, TextStyle } from "react-native"
import { Button, Text } from "@/components"
import { colors, spacing } from "@/theme"
import { TxKeyPath } from "@/i18n"

interface PermissionItemProps {
  title: TxKeyPath
  description: TxKeyPath
  status: boolean
}

interface PermissionsModalProps {
  visible: boolean
  locationStatus: boolean
  cameraStatus: boolean
  mediaLibraryStatus: boolean
  onRequestPermission: (type: "location" | "camera" | "mediaLibrary") => void
  onOpenSettings: () => void
}

const PermissionItem: FC<PermissionItemProps> = ({ title, description, status }) => {
  return (
    <View style={$permissionItem}>
      <Text tx={title} preset="subheading" style={$permissionTitle} />
      <Text tx={description} preset="formHelper" style={$permissionDescription} />
      <Text preset="formLabel" style={$permissionStatus}>
        {status ? "Permitido" : "Negado"}
      </Text>
    </View>
  )
}

export const PermissionsModal: FC<PermissionsModalProps> = ({
  visible,
  locationStatus,
  cameraStatus,
  mediaLibraryStatus,
  onRequestPermission,
  onOpenSettings,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={$modalContainer}>
        <View style={$modalContent}>
          <Text tx="permissions:title" preset="heading" style={$title} />
          <Text tx="permissions:description" preset="formHelper" style={$description} />

          <View style={$permissionsList}>
            <PermissionItem
              title="permissions:location.title"
              description="permissions:location.description"
              status={locationStatus}
            />
            <PermissionItem
              title="permissions:camera.title"
              description="permissions:camera.description"
              status={cameraStatus}
            />
            <PermissionItem
              title="permissions:mediaLibrary.title"
              description="permissions:mediaLibrary.description"
              status={mediaLibraryStatus}
            />
          </View>

          <View style={$buttonContainer}>
            <Button
              tx="permissions:allow"
              preset="default"
              onPress={() => {
                if (!locationStatus) onRequestPermission("location")
                if (!cameraStatus) onRequestPermission("camera")
                if (!mediaLibraryStatus) onRequestPermission("mediaLibrary")
              }}
            />
            <Button
              tx="permissions:openSettings"
              preset="default"
              style={$settingsButton}
              onPress={onOpenSettings}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const $modalContainer: ViewStyle = {
  flex: 1,
  backgroundColor: colors.background + "CC",
  justifyContent: "center",
  alignItems: "center",
  padding: spacing.lg,
}

const $modalContent: ViewStyle = {
  backgroundColor: colors.background,
  borderRadius: 8,
  padding: spacing.lg,
  width: "100%",
  maxWidth: 400,
}

const $title: TextStyle = {
  textAlign: "center",
  marginBottom: spacing.xs,
}

const $description: TextStyle = {
  textAlign: "center",
  marginBottom: spacing.lg,
}

const $permissionsList: ViewStyle = {
  marginBottom: spacing.lg,
}

const $permissionItem: ViewStyle = {
  marginBottom: spacing.md,
}

const $permissionTitle: TextStyle = {
  marginBottom: spacing.xs,
}

const $permissionDescription: TextStyle = {
  marginBottom: spacing.xs,
}

const $permissionStatus: TextStyle = {
  color: colors.tint,
}

const $buttonContainer: ViewStyle = {
  gap: spacing.sm,
}

const $settingsButton: ViewStyle = {
  backgroundColor: colors.palette.neutral300,
}
