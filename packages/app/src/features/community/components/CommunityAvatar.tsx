import { SmartImage } from "@app/shared"
import { useTheme } from "@app/shared/theme/themeStore"
import { View } from "react-native"

interface CommunityAvatarProps {

}

export const CommunityAvatar = (props: CommunityAvatarProps) => {
  const { theme } = useTheme()

  return <View>
    <SmartImage source={undefined} placeholder="C" height={40} width={40} style={{ borderRadius: 20, }} />
  </View>
}