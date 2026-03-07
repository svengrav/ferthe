import StoryList from '@app/features/story/components/StoryList'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { Stack, Text } from '@app/shared/components'
import { Story } from '@shared/contracts'
import { useEffect, useState } from 'react'

interface SpotStoriesProps {
  spotId: string
  refreshKey?: number
}

function SpotStories({ spotId, refreshKey }: SpotStoriesProps) {
  const { storyApplication } = getAppContextStore()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    storyApplication.listPublicStoriesBySpot(spotId).then(result => {
      if (!cancelled) {
        setStories(result.data ?? [])
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [spotId, refreshKey])

  return (<Stack style={{ marginTop: 12 }}>
    <Text variant='title' align='center'>Shared Stories</Text>
    <StoryList stories={stories} loading={loading} />
  </Stack>)
}

export default SpotStories
