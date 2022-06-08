import { gql, GraphQLClient } from 'graphql-request'
import uniqBy from 'lodash/uniqBy'

const client = new GraphQLClient('https://api.github.com/graphql', {
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_AUTH_TOKEN}`
  }
})

const ORG = 'basementstudio'
const REPO = 'experiments'
const BRANCH = 'main'

export const getFileContributors = async (file: string) => {
  const query = gql`
    query {
      repository(owner: "${ORG}", name: "${REPO}") {
        object(expression: "${BRANCH}") {
          ... on Commit {
            history(path: "${file}") {
              nodes {
                author {
                  user {
                    id
                    url
                    name
                    avatarUrl
                    email
                    company
                  }
                }
              }
            }
          }
        }
      }
    }
  `

  const data = await client.request(query)

  const uniqueContributors = uniqBy(
    data.repository.object.history.nodes,
    (n: any) => {
      return n.author.user.id
    }
  ).map((n: any) => n.author.user)

  return uniqueContributors
}
