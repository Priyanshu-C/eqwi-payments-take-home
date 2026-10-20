import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import '@fontsource-variable/space-grotesk'
import './styles/tokens.css'
import './styles/base.css'
import { ApolloProvider } from '@apollo/client/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { createApolloClient } from './graphql/client'
import { createMockApi } from './mock/mockApi'
import { isScenario } from './mock/scenarios'

const params = new URLSearchParams(window.location.search)
const scenario = params.get('scenario')

const api = createMockApi({
  scenario: isScenario(scenario) ? scenario : 'normal',
  seed: params.get('seed') === 'empty' ? [] : undefined,
})
const client = createApolloClient(api.link)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApolloProvider client={client}>
      <App api={api} />
    </ApolloProvider>
  </StrictMode>,
)
