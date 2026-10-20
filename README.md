# Payment methods

A single screen that lists saved payment methods and adds new ones from a few fake card presets. Everything goes through Apollo Client to a GraphQL schema that runs in the browser, so there's no server to start.

All data is synthetic. There are no card number or CVV fields: you pick a preset and give it a nickname.

## Running it

You need Node 22.12+ or 24 (Vitest 5 doesn't support 23 or 25; `.nvmrc` pins 24) and npm.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest + React Testing Library, single run
npm run typecheck
npm run lint
```

## Mock scenarios

At the bottom of the page there's a dark **Mock API** panel. The scenario you pick applies to every request until you change it, and it's copied into the URL as `?scenario=`, so you can reload with it. Every response takes 700 ms so the pending states are visible. Reloading the page resets the store.

The panel also shows how many cards and idempotency keys the mock server has. That's the easiest way to check that a retry didn't save a second card.

| Scenario                 | How to reproduce                                                                                                                                                                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Normal success           | The default. Pick a card, type a nickname, press **Add card**. It appears at the end of the list.                                                                                                                                                                                           |
| Query failure            | Open `/?scenario=list-error`, or pick "Loading the list fails" and reload. The list shows an error. Switch to Normal and press **Try again**.                                                                                                                                               |
| Rejected before saving   | Pick "Add is rejected before saving" and add a card. You get an error, the form keeps its values, and the server count doesn't change. Switch to Normal and press **Add card** again.                                                                                                       |
| Saved, but response lost | Pick "Add saves, but the response is lost" and add a card. The UI says it couldn't confirm the save and the form locks. The panel already shows 3 cards on the server while the list still shows 2. Switch to Normal and press **Retry**: the card appears once and the server still has 3. |
| Empty state              | Open `/?seed=empty` (there's a link in the panel).                                                                                                                                                                                                                                          |

In the lost-response scenario you can also press Retry while it's still selected. That reply is lost too, but the server answers from the stored key and doesn't save again.

## How it's put together

```
src/
  main.tsx                       reads ?scenario= / ?seed=, creates the mock and client
  App.tsx
  styles/                        design tokens and base styles
  graphql/
    schema.graphql               the schema (also what the mock executes)
    types.ts                     handwritten types matching the schema
    contract.ts                  card presets and the nickname limit, shared with the mock
    client.ts                    Apollo client and cache
  mock/
    store.ts                     in-memory "server": cards and idempotency records
    mockApi.ts                   resolvers + a link that adds latency / drops replies
    scenarios.ts
    ScenarioPanel.tsx            reviewer controls
  payment-methods/
    PaymentMethodsScreen.tsx
    list/PaymentMethodList.tsx   loading / error / empty / list
    add/
      AddPaymentMethodForm.tsx   form, validation display, status messages
      useAddPaymentMethod.ts     idempotency key and retry handling
      validation.ts
    data/
      operations.ts              typed query and mutation (TypedDocumentNode)
      cache.ts                   cache update after a successful add
    card/                        brand tile, expiry and card name formatting
  test/renderScreen.tsx          renders the screen against a fresh mock API
```

The mock is split the same way a real setup would be. The resolvers act as the server: they decide what gets rejected and what gets saved. A custom Apollo link in front of `SchemaLink` acts as the network: it adds the delay, and for "response lost" it lets the request run (so the card is saved) and then throws away the reply. To the client that's indistinguishable from a dropped connection.

## Cache updates

`PaymentMethod` has an `id`, so Apollo normalizes every card as `PaymentMethod:<id>` without extra config. The query and the mutation select the same fragment, so a card returned by the mutation is complete enough to write into the list.

After a successful add, the mutation's `update` appends the card to the cached `paymentMethods` list with `cache.updateQuery`, unless a card with that id is already there. There's no refetch, and the tests check that the list query only goes out once. The id check is what keeps a repeated response from duplicating a row. A retry after a lost reply gets the original card back with the same id, and normalization merges it into the existing entry.

I didn't use an optimistic update. A card row showing up before the server has confirmed it felt wrong for payment methods, especially when the response can be lost. The pending state lives in the form instead.

## Retries and idempotency

Each add is an _attempt_: an idempotency key (`crypto.randomUUID()`) plus the exact input sent with it. The hook keeps the attempt until it succeeds.

- Submitting the same preset and nickname again reuses the key. That's a retry.
- Submitting different details creates a new key. That's a new operation.
- After a success the attempt is cleared, so the next add always gets a new key, even with identical details.

How it handles failures depends on what kind they are:

- **Rejected before saving.** The server answered with an error code that means it refused the request up front (`BAD_USER_INPUT`, `PROCESSOR_UNAVAILABLE`). The values stay in the form and stay editable. Resending them unchanged reuses the key. Editing them makes a new operation.
- **Unknown outcome.** Anything else: a network error, a lost reply, or a GraphQL error with any other code, since an unexpected server error could have happened after the write. The form locks to the values that were sent (nickname and card), and the button turns into **Retry**, which resends the same key and input. The fields unlock once the server answers with a success or a rejection. This lock is the only editing restriction. Without it you could change the nickname or the card and save a second one.

The mock server stores each result by key. Replaying a key with the same input returns the original card and saves nothing. Replaying it with different input fails with `IDEMPOTENCY_KEY_REUSED`. A key that's already been saved is answered from storage before anything else, so a retry still gets its card back even while the "rejected" scenario is on.

The key is what makes a double submit safe. On top of that, the button uses `aria-disabled` while pending so it keeps focus, and a ref stops two submits that land in the same tick. If two requests did go out anyway, they'd carry the same key and the server would save one card.

## Tests

`npm test` runs 34 tests.

- `validation.test.ts`: required preset, required nickname, trimming, the 40/41 character boundary.
- `store.test.ts`: replaying a key returns the original, a reused key with different input is rejected, and the server validates input too.
- `mockApi.test.ts`: the same idempotency rules through Apollo, and the lost-response scenario saving the card while the client gets an error.
- `cache.test.ts`: appends, ignores a repeated response, and doesn't create the list if it was never loaded.
- `PaymentMethodList.test.tsx`: loading then populated, the empty state, and failure then retry.
- `AddPaymentMethodForm.test.tsx`: validation and focus. Pending then success, including a double click sending one request and no list refetch. Rejection then retry with the same key. Edited details after a rejection getting a new key. A lost response, then a lost retry, then a successful retry, ending with exactly one card in both the store and the list. A retry answered from the stored key while new adds are being rejected. The list reloading before the retry, so the replayed card is already in the cache. A deliberate second add getting a new key.
- `useAddPaymentMethod.test.tsx`: two `add` calls in the same tick send one request, and an unexpected server error counts as an unknown outcome.

The tests render the real screen against the real mock API and Apollo client. The only stub is one hook test that fakes a 500-style error. A recording link captures each outgoing request so the tests can compare idempotency keys and count refetches.

## Known gaps

- The unresolved attempt lives in a ref inside the add hook. If the screen unmounts or the page reloads while an add is unresolved, the key is forgotten, and adding the same card again can save a duplicate. A real version would keep the attempt in `sessionStorage` (or the client) and restore the locked form on mount.
- Retry is manual. There's no automatic retry with backoff, and no way to abandon an unresolved add short of reloading. A "discard" action would need a warning that the card may already be saved.
- Which error codes mean "nothing was saved" is a contract I made up for the mock. A real API would have to document it.
- Operation types are handwritten. With more than two operations I'd generate them with GraphQL Code Generator.
- The presets live in `graphql/contract.ts`, shared by the form and the mock. In a real app the card would come from a tokenization SDK.
- Idempotency records never expire.
- The production bundle is over 500 kB because graphql-js ships to the browser to run the mock. A build talking to a real endpoint wouldn't include it.
- I checked roles, labels and keyboard flow in tests and by hand, but not with a real screen reader.

## As a micro-frontend

I'd expose `PaymentMethodsScreen` from a remote, either through Module Federation or as a custom element if the host isn't React. `react`, `react-dom`, `@apollo/client` and `graphql` should be shared singletons. Two copies of graphql break at runtime; `vite.config.ts` works around the same problem in Vitest. I'd let the host pass in its `ApolloClient`, so the new card lands in the same cache other parts of the app read, and fall back to a client the remote creates itself when it's mounted standalone. Auth and the endpoint stay with the host's link chain. The remote would emit an event like `payment-method:added` for anything that isn't cache-driven.

## Time spent

About 3 hours, including reading through everything and testing each scenario by hand.

## AI use

I used Claude Code for most of the implementation: the mock, the components, the tests and a first draft of this README. I settled the design with it before any code was written (the server/network split in the mock, the retry rule, skipping optimistic updates). I checked the output by running the suite, by breaking the retry logic on purpose to make sure the tests catch it, and by going through each scenario in the browser. Forcing a new key on every attempt fails both retry tests, and removing the in-flight guard fails the same-tick test.
