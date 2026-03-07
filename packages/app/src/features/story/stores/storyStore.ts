import { Story } from '@shared/contracts'
import { create } from 'zustand'

interface StoryStoreState {
  stories: Record<string, Story>
  setStory: (contextId: string, story: Story) => void
  clearStory: (contextId: string) => void
}

const storyStore = create<StoryStoreState>(set => ({
  stories: {},
  setStory: (contextId, story) =>
    set(state => ({ stories: { ...state.stories, [contextId]: story } })),
  clearStory: contextId =>
    set(state => {
      const { [contextId]: _, ...rest } = state.stories
      return { stories: rest }
    }),
}))

// Hooks
export const useStory = (contextId: string): Story | undefined =>
  storyStore(state => state.stories[contextId])

// Selectors
export const getStoryActions = () => ({
  setStory: storyStore.getState().setStory,
  clearStory: storyStore.getState().clearStory,
})
