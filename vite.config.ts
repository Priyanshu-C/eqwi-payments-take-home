import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // graphql 16 ships CJS and ESM builds without an exports map. Left external,
    // Apollo loads the CJS copy while our code gets the ESM one, and SchemaLink
    // fails with "Cannot use GraphQLSchema from another module or realm".
    server: { deps: { inline: ['@apollo/client'] } },
  },
})
