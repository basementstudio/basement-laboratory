import { Meta } from '~/components/common/meta'
import Welcome from '~/components/common/welcome'
import { PageLayout } from '~/components/layout/page'

const HomePage = () => {
  return (
    <PageLayout>
      <Meta />

      <Welcome />
    </PageLayout>
  )
}

export default HomePage
