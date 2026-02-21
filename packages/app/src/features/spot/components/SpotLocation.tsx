import { Chip } from "@app/shared/components";
import { GeoLocation } from "@shared/geo";
import { StyleProp, ViewStyle } from "react-native";


interface SpotLocationProps { location?: GeoLocation, style?: StyleProp<ViewStyle> }


export function SpotLocation(props: SpotLocationProps) {
  const { location, style } = props

  return <Chip icon="pin-drop" style={style} variant="primary" label={location ? `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`
    : 'Location data not available'} />

}