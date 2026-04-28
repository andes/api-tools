# Copilot instructions

## Build, test, and lint commands

- Use Node `18.20.8`, Yarn classic `1.22.x`, and TypeScript `4.4` as the current baseline.
- Start from the repo root with `yarn install`.
- Compile all packages with `yarn prepare`.
- Run the full lint suite with `yarn lint`.
- Run the full test suite with `yarn test`.
- `yarn start` runs `tsc -w` in every workspace in parallel.
- For one workspace, use:
  - `yarn test --scope=@andes/api-tool`
  - `yarn run lint --scope=@andes/core`
- For a single Jest file, run it inside the target workspace, for example:
  - `cd api-tool && yarn test --runInBand src/bootstrap/index.spec.ts`
  - `cd core && yarn test --runInBand src/query-builder/select.spec.ts`
- The currently validated green path is: `yarn install`, `yarn prepare`, `yarn lint`, and `yarn test` from the repo root using Node `18.20.8`.
- Additional validated workspace checks include `yarn test --scope=@andes/api-tool`, `yarn test --scope=@andes/core`, `yarn test --scope=@andes/services`, and `yarn test --scope=@andes/mongoose-plugin-audit`.
- Mongo-backed tests in `core`, `services`, `mongoose-plugin-audit`, and `mongoose-token-search` are stabilized on Node 18 with `mongodb-memory-server-global@8.16.1`.

## High-level architecture

- `api-tool` is the HTTP foundation. It wraps Express in `ApiBootstrap`, adds JSON/body parsing, boolean query parsing, `/alive` and `/version` endpoints, optional JWT auth, and a shared error middleware.
- `core` builds higher-level REST resources on top of `api-tool` and Mongoose. `ResourceBase` provides CRUD, route generation, auth hooks, search configuration, default filters, and optional event emission.
- `event-bus` is the event layer. `core` emits lifecycle events such as `${resourceModule}:${resourceName}:create|update|remove`, and `event-bus` provides the `EventBus` instances and webhook/rule processing around those events.
- `etl` is the shared transformation engine used by other packages. `services` and `event-bus` both depend on it.
- `services` is an integration runner around HTTP, email, static, dynamic, and Mongo-backed service definitions. It depends on the external package `@andes/log`.
- `georeference` and `fuentes-autenticas` are standalone integration packages.
- `mongoose-plugin-audit` and `mongoose-token-search` are reusable Mongoose plugins shared outside the higher-level API stack.

## Key conventions

- Workspace packages use the `@andes/*` scope. Root `tsconfig.json` maps those imports directly to sibling `src/` directories.
- The common package layout is `src/` for sources, `build/` for emitted JS/types, `tsconfig.build.json` for compilation, `tsconfig.test.json` for tests, and colocated Jest specs named `*.spec.ts`.
- `src/index.ts` is usually a barrel of named exports. Follow the existing `export * from './module'` pattern instead of introducing default exports.
- Build configs exclude tests and emit declarations into `build/`.
- `core` is the package that ties Express request types to Mongoose models. When changing resource behavior, inspect both `core/src/model-builder` and `api-tool/src/bootstrap`.
- `ResourceBase` uses `searchFileds`, `routesEnable`, `routesAuthorization`, `extrasRoutes`, and `defaultParams` as the main extension points.
- Audit behavior is explicit: `mongoose-plugin-audit` expects `document.audit(req)` before save so the plugin can populate `createdBy` / `updatedBy`.
- Tokenized search is schema-driven: `mongoose-token-search` adds a `tokens` field and pre-save token generation, then exposes a static `search()` query builder on the model.
- Most packages inherit strict compiler settings from `tsconfig.base.json`, but `core` and `services` locally relax `noImplicitAny`.
- Do not use `yarn add` from inside a workspace. Use `lerna add <pkg> --scope=@andes/<workspace>` or update `package.json` and rerun `yarn install`.
- Do not reintroduce `babel-jest` transforms in packages that only run TypeScript tests; current Jest stabilization relies on `ts-jest` alone in those packages.
