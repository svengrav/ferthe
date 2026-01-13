import Markdown from '@/components/Markdown'
import Page from '@/components/Page'
import enHomeDe from '@/content/de/home.md'
import enHomeMd from '@/content/en/home.md'
import { useMarkdown } from '@/hooks/useMarkdown'
import { useEffect, useState } from 'react'
import { Logo } from '../logo'

export function Home() {
  const [fadeIn, setFadeIn] = useState(false)
  const englishHomeStory = useMarkdown(enHomeMd)
  const germanHomeStory = useMarkdown(enHomeDe)

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeIn(true)
    }, 100) // Delay before fading in
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className='bg-gray-950 flex flex-grow items-center justify-center p-8'>
      <div className={`opacity-0 transition-opacity duration-1000 ${fadeIn ? 'opacity-100' : 'opacity-0'
        }`}>
        <Logo
          className={`h-52 mt-10 hover:animate-pulse mx-auto mb-4 fill-white transition-transform duration-1000 ${fadeIn ? 'scale-100' : 'scale-75'
            }`}
        />
        <Page>
          <div className='lg:grid-cols-2 grid gap-8'>
            <div> <Markdown content={germanHomeStory} /></div>
            <div className='opacity-60'> <Markdown content={englishHomeStory} /></div>
          </div>
        </Page>
      </div>
    </div>
  )
}
