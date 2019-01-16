import React, { Component, Fragment } from 'react'
import Meta from '~/components/Meta/Meta'
import { getUrlFromRequestOrWindow } from '~/lib/utility'
import { verifyEmail } from '~/services/auth'

type Props = {
  hasError?: string
  meta?: any
}

type State = {}

class VerifyEmail extends Component<Props, State> {

  static async getInitialProps({ query, req }) {
    const token = query.token

    const meta = {
      currentUrl: getUrlFromRequestOrWindow(req),
      description: `Verify your email address on Podverse`,
      title: `Verify your email address`
    }
    
    try {
      await verifyEmail(token)

      return { meta }
    } catch (error) {
      return { hasError: true, meta }
    }
  }

  render() {
    const { hasError, meta } = this.props

    return (
      <Fragment>
        <Meta
          description={meta.description}
          ogDescription={meta.description}
          ogTitle={meta.title}
          ogType='website'
          ogUrl={meta.currentUrl}
          robotsNoIndex={true}
          title={meta.title}
          twitterDescription={meta.description}
          twitterTitle={meta.title} />
        {
          !hasError &&
            <Fragment>
              <h4>Verification successful</h4>
              <p>Have a nice day :)</p>
            </Fragment>
        }
        {
          hasError &&
            <Fragment>
              <h4>Verification failed</h4>
              <p>This token may have expired.</p>
              <p>Resend verification email</p>
            </Fragment>
        }
      </Fragment>
    )
  }
}

export default VerifyEmail
