import StoryList from '@app/features/story/components/StoryList'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { Story } from '@shared/contracts'
import { useEffect, useState } from 'react'

interface TrailStoriesProps {
  trailId: string
  refreshKey?: number
}

function TrailStories({ trailId, refreshKey }: TrailStoriesProps) {
  const { storyApplication } = getAppContextStore()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    storyApplication.listPublicStoriesByTrail(trailId).then(result => {
      if (!cancelled) {
        setStories(result.data ?? [])
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [trailId, refreshKey])

  return <StoryList stories={stories} loading={loading} />
}

export default TrailStories
