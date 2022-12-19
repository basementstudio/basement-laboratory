import { Container, ContainerProps } from './container'

type Props = {
  children?: React.ReactNode
  contain?: boolean | ContainerProps
}

export const PageLayout = ({ children, contain }: Props) => {
  return (
    <>
      {/* TODO Header */}
      {/* <Header /> */}
      <main>{contain ? <Container>{children}</Container> : children}</main>
      {/* TODO Footer */}
      {/* <Footer /> */}
    </>
  )
}
