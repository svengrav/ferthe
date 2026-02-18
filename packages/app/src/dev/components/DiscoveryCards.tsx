import { useDiscoveries } from '@app/features/discovery'
import { DiscoveryHorizontalList } from '@app/features/discovery/components/DiscoveryHorizontalList'
import { useDiscoveryTrailId } from '@app/features/discovery/stores/discoveryTrailStore'
import { useSpots } from '@app/features/spot'
import { Page, Text } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { Theme, useThemeStore } from '@app/shared/theme'
import { Discovery, Spot } from '@shared/contracts'
import { useState } from 'react'
import { Image, Pressable, StyleSheet, View } from 'react-native'

/**
 * Enriches discoveries with spot data by joining arrays.
 */
function enrichDiscoveriesWithSpots(discoveries: Discovery[], spots: Spot[]) {
  const spotMap = new Map(spots.map(s => [s.id, s]))
  return discoveries.map(discovery => ({
    ...discovery,
    spot: spotMap.get(discovery.spotId),
  }))
}

export default function DevScreen() {
  const theme = useThemeStore()
  const { t } = useLocalizationStore()
  const [visible, setVisible] = useState(false)
  const [currentDiscovery, setCurrentDiscovery] = useState<any | null>(null)
  const [isDiscoveryVisible, setDiscoveryVisible] = useState(false)

  const trailId = useDiscoveryTrailId()
  const discoveries = useDiscoveries()
  const spots = useSpots()

  const filteredDiscoveries = discoveries.filter(d => d.trailId === trailId)
  const filteredSpots = spots.filter(s => filteredDiscoveries.some(d => d.spotId === s.id))
  const enrichedDiscoveries = enrichDiscoveriesWithSpots(filteredDiscoveries, filteredSpots)
  const discoveryCards = [
    ...enrichedDiscoveries.map(d => ({
      ...d,
      id: d.id,
      imageUrl:
        'https://frankkoebsch.wordpress.com/wp-content/uploads/2011/02/altstadtblick-c-aquarell-von-frank-hess.jpg',
      title: d.spot?.name || 'Unknown Spot',
      createdAt: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Unknown Date',
    })),
    {
      title: 'Unknown Spot',
      id: 'unknown',
      imageUrl:
        'https://frankkoebsch.wordpress.com/wp-content/uploads/2011/02/altstadtblick-c-aquarell-von-frank-hess.jpg',
      createdAt: 'Not yet',
    },
    {
      title: 'Unknown Spot',
      imageUrl:
        'https://frankkoebsch.wordpress.com/wp-content/uploads/2011/02/altstadtblick-c-aquarell-von-frank-hess.jpg',
      id: 'unknown',
      createdAt: 'Not yet',
    },
  ]

  const handleDiscoveryPress = (item: any) => {
    setCurrentDiscovery(item)
    setDiscoveryVisible(true)
  }

  const closeDiscovery = () => setDiscoveryVisible(false)

  return (
    <Page
      options={[
        {
          label: 'Settings',
          onPress: () => setVisible(true),
        },
      ]}>

      <DiscoveryHorizontalList
        discoveries={discoveryCards}
        renderItem={({ item }) => (
          <Pressable onPress={() => handleDiscoveryPress(item)}>
            <View
              style={{
                width: 150,
                aspectRatio: 2 / 3,
                borderRadius: 20,
                overflow: 'hidden',
                backgroundColor: theme.colors.background,
              }}>
              {/* Image oben einfügen, falls vorhanden */}
              {'imageUrl' in item && item.imageUrl && (
                <View style={{ width: '100%', aspectRatio: 2 / 3, backgroundColor: '#eee' }}>
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                  />
                </View>
              )}
              <View
                style={{
                  flex: 1,
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  padding: 8,
                  alignContent: 'center',
                }}>
                <Text style={{ textAlign: 'center' }}>{item.title}</Text>
                <Text variant='caption' style={{ paddingVertical: 4 }}>
                  {item.createdAt}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </Page>
  )
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 4,
      paddingVertical: 8,
      marginBottom: 8,
    },

    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      justifyContent: 'flex-end',
    },
    title: {
      width: '100%',
      textAlign: 'center',
      position: 'absolute',
    },
    intro: {
      padding: 16,
      flex: 1,
      alignItems: 'center',
      textAlign: 'center',
      color: theme.colors.primary,
    },
    introText: {
      maxWidth: 200,
      textAlign: 'center',
      backgroundColor: theme.colors.background,
      color: theme.colors.onBackground,
      marginTop: 10,
      marginBottom: 25,
      lineHeight: 30,
    },
    logo: {
      marginBottom: 10,
    },
    listContent: {
      gap: 16,
      paddingHorizontal: 8, // Optional: Add some horizontal padding if needed
    },
  })
