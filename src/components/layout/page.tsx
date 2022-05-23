import { Container, ContainerProps } from './container'

type Props = {
  children?: React.ReactNode
  contain?: boolean | ContainerProps

  // TODO after implementing header, footer
  // headerProps?: HeaderProps
  // footerProps?: FooterProps
}

export const PageLayout = ({ children, contain }: Props) => {
  return (
    <>
      {/* TODO Header */}
      {/* <Header /> */}
      <main>
        {contain ? <Container {...contain}>{children}</Container> : children}
      </main>
      {/* TODO Footer */}
      {/* <Footer /> */}
    </>
  )
}
