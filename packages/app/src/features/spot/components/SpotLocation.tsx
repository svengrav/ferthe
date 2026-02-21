import { Chip } from "@app/shared/components";
import { GeoLocation } from "@shared/geo";

export function SpotLocation(props: { location?: GeoLocation }) {
  const { location } = props

  return <Chip label={location ? `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`
    : 'Location data not available'} />

}