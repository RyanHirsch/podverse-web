import { GetServerSideProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import OmniAural, { useOmniAural } from 'omniaural'
import { Page } from '~/lib/utility/page'
import { PV } from '~/resources'
import { getServerSideAuthenticatedUserInfo } from '~/services/auth'
import { getServerSideUserQueueItems } from '~/services/userQueueItem'
import { ButtonLink, ColumnsWrapper, ComparisonTable, MembershipStatus, Meta, PageHeader, PageScrollableContent, SideContent } from '~/components'
import { isBeforeDate } from '~/lib/utility/date'

interface ServerProps extends Page { }

const keyPrefix = 'pages_membership'

export default function Membership(props: ServerProps) {

  /* Initialize */

  const { t } = useTranslation()
  const [userInfo] = useOmniAural('session.userInfo')

  /* Meta Tags */

  const meta = {
    currentUrl: `${PV.Config.WEB_BASE_URL}${PV.RoutePaths.web.membership}`,
    description: t('pages:membership._Description'),
    title: t('pages:membership._Title')
  }
  
  return (
    <>
      <Meta
        description={meta.description}
        ogDescription={meta.description}
        ogTitle={meta.title}
        ogType='website'
        ogUrl={meta.currentUrl}
        robotsNoIndex={false}
        title={meta.title}
        twitterDescription={meta.description}
        twitterTitle={meta.title} />
      <PageHeader text={t('Membership')} />
      <PageScrollableContent>
        <ColumnsWrapper
          mainColumnChildren={
            <div className='text-page'>
              <MembershipStatus />
              <ComparisonTable
                aboveSectionNodes={
                  <>
                    <p>{t('Get 1 year free when you sign up for Podverse premium')}</p>
                    <p>{t('10 per year after that')}</p>
                    <div className='button-column'>
                      {
                        !userInfo && (
                          <ButtonLink
                            label={t('Login')}
                            onClick={() => OmniAural.modalsLoginShow()} />
                        )
                      }
                      {
                        userInfo && (
                          <ButtonLink
                            label={t('Renew Membership')}
                            onClick={() => OmniAural.modalsCheckoutShow()} />
                        )
                      }
                    </div>
                  </>
                }
                featuresData={featuresData(t)}
                headerIcon1={t('Free')}
                headerIcon2={t('Premium')}
                headerText={t('Features')} />
            </div>
          }
          sideColumnChildren={<SideContent />}
        />
      </PageScrollableContent>
    </>
  )
}

const featuresData = (t) => [
  {
    text: t('features - subscribe to podcasts'),
    icon1: true,
    icon2: true
  },
  {
    text: t('features - download episodes'),
    icon1: true,
    icon2: true
  },
  {
    text: t('features - sleep timer'),
    icon1: true,
    icon2: true
  },
  {
    text: t('features - light / dark mode'),
    icon1: true,
    icon2: true
  },
  {
    text: t('features - drag-and-drop queue'),
    icon1: false,
    icon2: true
  },
  {
    text: t('features - create and share clips'),
    icon1: false,
    icon2: true
  },
  {
    text: t('features - sync your subscriptions on all devices'),
    icon1: false,
    icon2: true
  },
  {
    text: t('features - sync your queue on all devices'),
    icon1: false,
    icon2: true
  },
  {
    text: t('features - create playlists'),
    icon1: false,
    icon2: true
  },
  {
    text: t('features - download a backup of your data'),
    icon1: false,
    icon2: true
  },
  {
    text: t('features - support free and open source software'),
    icon1: true,
    icon2: true,
    iconType: 'smile'
  }
]

/* Server-Side Logic */

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req, locale } = ctx
  const { cookies } = req

  const userInfo = await getServerSideAuthenticatedUserInfo(cookies)
  const userQueueItems = await getServerSideUserQueueItems(cookies)

  const serverProps: ServerProps = {
    serverUserInfo: userInfo,
    serverUserQueueItems: userQueueItems,
    ...(await serverSideTranslations(locale, PV.i18n.fileNames.all)),
    serverCookies: cookies
  }

  return { props: serverProps }
}
