import { useOmniAural } from 'omniaural'
import { Episode, MediaRef } from 'podverse-shared'
import { useTranslation } from 'react-i18next'
import { MediaItemControls, TruncatedText } from '~/components'
import { readableDate } from '~/lib/utility/date'
import { getClipTitle, getEpisodeTitle } from '~/lib/utility/misc'

type Props = {
  clip: MediaRef
  episode: Episode
  includeMediaItemControls?: boolean
}

export const ClipInfo = ({ clip, episode }: Props) => {
  const { t } = useTranslation()
  const [userInfo] = useOmniAural('session.userInfo')
  const episodeTitle = getEpisodeTitle(t, episode)
  const episodePubDate = readableDate(episode.pubDate)
  const title = getClipTitle(t, clip, episode.title)

  return (
    <div className='clip-info'>
      <div className='episode-title'>
        {episodeTitle}
      </div>
      <div className='episode-pub-date'>
        {episodePubDate}
      </div>
      <div className='clip-title'>
        {title}
      </div>
      <MediaItemControls
        buttonSize='large'
        episode={episode}
        hidePubDate
        isLoggedInUserMediaRef={userInfo && userInfo.id === clip.owner.id}
        mediaRef={clip} />
      <hr />
    </div>
  )
}
