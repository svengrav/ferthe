import { Image } from "@app/shared/components"
import { useLocalizationStore } from "@app/shared/localization/useLocalizationStore"
import { useTheme } from "@app/shared/theme/themeStore"
import { View } from "react-native"

interface CommunityAvatarProps {

}

export const CommunityAvatar = (props: CommunityAvatarProps) => {
  const { theme } = useTheme()
  const { t } = useLocalizationStore()

  return <View>
    <Image source={undefined} placeholder={t.community.placeholder} height={40} width={40} style={{ borderRadius: 20, }} />
  </View>
}