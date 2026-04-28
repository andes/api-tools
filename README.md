# api-tools

Monorepo de librerias TypeScript mantenido con Yarn Workspaces + Lerna. El repositorio no contiene una aplicacion unica para levantar; agrupa paquetes reutilizables para APIs, recursos Mongoose, integraciones externas, ETL y utilidades compartidas.

## Que contiene el monorepo

- `api-tool`: bootstrap de Express para APIs, con JWT opcional, middlewares base y endpoints `/alive` y `/version`.
- `core`: capa de recursos sobre Mongoose y Express. Aporta `ResourceBase`, builders de queries y cache.
- `event-bus`: bus de eventos y webhooks.
- `etl`: transformaciones de datos configurables por esquema.
- `services`: ejecucion de servicios HTTP, email, Mongo y servicios dinamicos apoyados en ETL.
- `georeference`: geocodificacion y conversion de coordenadas.
- `fuentes-autenticas`: integraciones SOAP con fuentes externas como RENAPER y SISA.
- `mongoose-plugin-audit`: plugin de auditoria para Mongoose.
- `mongoose-token-search`: plugin de tokenizacion y busqueda por prefijos para Mongoose.

## Baseline actual

El objetivo actual es estabilizar el monorepo sobre:

- Node `18.20.8`
- Yarn classic `1.22.x`
- Lerna `2.8.0`
- TypeScript `4.4`
- `@andes/log 3.0.1`

## Resumen de la actualización a Node 18

Para dejar el monorepo estable en Node 18 se hicieron estos cambios:

- se agrego `.nvmrc` con `18.20.8`
- el `package.json` raiz ahora declara `engines.node = 18.20.8` y `engines.yarn = 1.22.x`
- CircleCI se alineo a `cimg/node:18.20.8`
- los tests Mongo de `mongoose-plugin-audit`, `mongoose-token-search`, `core` y `services` se adaptaron a `mongodb-memory-server-global@8.16.1`
- esos tests Mongo usan `MongoMemoryServer.create(...)`, MongoDB `7.0.24` y `storageEngine: 'wiredTiger'`
- `fuentes-autenticas` ahora versiona sus snapshots en `src/__snapshots__/`

## Estado validado hoy

Con Node 18.20.8 quedaron validados estos pasos:

```bash
nvm install
nvm use
npm install -g yarn@1.22
yarn install
yarn prepare
yarn lint
```

Tambien quedaron validadas estas pruebas representativas:

```bash
cd api-tool && yarn test --runInBand src/index.spec.ts
cd api-tool && yarn test --runInBand src/bootstrap/index.spec.ts
cd core && yarn test --runInBand src/query-builder/select.spec.ts
cd core && yarn test --runInBand src/model-builder/index.spec.ts
cd mongoose-plugin-audit && yarn test --runInBand src/index.spec.ts
cd mongoose-token-search && yarn test --runInBand src/index.spec.ts
cd services && yarn test --runInBand src/index.spec.ts
```

Ademas, estos comandos por workspace tambien funcionan:

```bash
yarn test --scope=@andes/api-tool
yarn test --scope=@andes/mongoose-plugin-audit
yarn test --scope=@andes/mongoose-token-search
yarn test --scope=@andes/core
yarn test --scope=@andes/services
yarn test --scope=@andes/event-bus
```

Tambien quedo validado el test global del monorepo:

```bash
yarn test
```

## Ejecucion rapida desde cero

Si queres clonar el repo y probarlo desde cero, estos son los pasos actualizados:

```bash
git clone <repo>
cd api-tools
nvm install
nvm use
node -v
npm install -g yarn@1.22
yarn -v
yarn install
yarn prepare
yarn lint
yarn test
```

Valores esperados:

- `node -v` -> `v18.20.8`
- `yarn -v` -> `1.22.x`

## Comandos del monorepo

Todos estos comandos salen del `package.json` raiz:

```bash
yarn bootstrap   # lerna bootstrap
yarn prepare     # compila todos los paquetes con tsc
yarn test        # ejecuta tests de todos los paquetes
yarn lint        # ejecuta tslint en todos los paquetes
yarn start       # corre tsc -w en paralelo en todos los paquetes
yarn clean       # limpia node_modules via lerna
```

## Comandos por paquete

Dentro de cada workspace existen los mismos scripts base:

```bash
prepare -> tsc -p tsconfig.build.json
start   -> tsc -p tsconfig.build.json -w
lint    -> tslint --project tsconfig.build.json
test    -> jest
```

Ejemplos utiles:

```bash
yarn test --scope=@andes/api-tool
yarn run lint --scope=@andes/core
```

## Ejecutar un test puntual

Para un test puntual conviene entrar al paquete:

```bash
cd core
yarn test --runInBand src/query-builder/select.spec.ts
```

Otros ejemplos:

```bash
cd api-tool
yarn test --runInBand src/bootstrap/index.spec.ts

cd georeference
yarn test --runInBand src/geocode.spec.ts
```

## Flujo recomendado de desarrollo

1. Cargar la version correcta de Node e instalar dependencias:

```bash
nvm install
nvm use
npm install -g yarn@1.22
yarn install
```

2. Compilar todo el monorepo:

```bash
yarn prepare
```

3. Validar lint:

```bash
yarn lint
```

4. Validar tests empezando por los paquetes o archivos tocados:

```bash
yarn test --scope=@andes/api-tool
cd mongoose-plugin-audit && yarn test --runInBand src/index.spec.ts
cd mongoose-token-search && yarn test --runInBand src/index.spec.ts
cd services && yarn test --runInBand src/index.spec.ts
cd core && yarn test --runInBand src/query-builder/select.spec.ts
cd core && yarn test --runInBand src/model-builder/index.spec.ts
```

5. Si queres medir el estado global actual del monorepo:

```bash
yarn test
```

Hoy ese comando ya pasa completo en Node 18.20.8.

## Estado actual de la actualizacion

Hoy el build del monorepo ya esta estabilizado en Node 18:

- `yarn install` funciona
- `yarn prepare` funciona
- `yarn lint` funciona
- `yarn test` funciona
- CircleCI usa el mismo runtime validado localmente
- `@andes/mongoose-token-search`, `core/src/model-builder/index.spec.ts` y `services/src/index.spec.ts` ya corren en Node 18

El foco que sigue es sostener este baseline y decidir si conviene subir runtime o tooling otra vez.

## Warnings conocidos que hoy no bloquean

Al ejecutar `yarn test` en Node `18.20.8` todavia aparecen algunos warnings de dependencias viejas. Hoy no rompen el build ni el suite completo, pero conviene tenerlos presentes para una futura modernizacion:

| Paquete | Warning actual | Posible trabajo futuro |
| --- | --- | --- |
| `core`, `services`, `mongoose-plugin-audit`, `mongoose-token-search` | `current URL string parser is deprecated` | revisar la configuracion de conexion Mongoose/MongoDB y migrar a opciones modernas del driver |
| `services` | `Current Server Discovery and Monitoring engine is deprecated` | migrar a `useUnifiedTopology` o a una version mas nueva del driver/Mongoose |
| `mongoose-token-search` | `collection.ensureIndex is deprecated` | reemplazar `ensureIndex` por `createIndexes` o por la API equivalente del schema |
| `event-bus` | warning de Mongoose sobre `Jest's default jsdom test environment` | revisar si conviene explicitar `testEnvironment: 'node'` en su `jest.config.js` |
| `event-bus`, `fuentes-autenticas` | `Buffer() is deprecated` | ubicar llamadas legacy a `Buffer()` y migrarlas a `Buffer.from` / `Buffer.alloc` |

Estos warnings quedaron observados en una ejecucion limpia desde cero del monorepo con Node `18.20.8`.

## Convenciones utiles para entender el repo

- Los paquetes usan el scope `@andes/*`.
- El `tsconfig.json` raiz mapea imports internos a los `src/` de otros workspaces.
- El patron mas comun es `src/index.ts` como barrel export con `export * from ...`.
- La salida compilada va a `build/`.
- Los tests estan colocalizados dentro de `src/` y suelen llamarse `*.spec.ts`.
- `core` depende de `api-tool`; si tocas recursos HTTP o queries, normalmente hay que mirar ambos paquetes.
- `services` depende de `@andes/log`, que no vive en este monorepo.

## Tips para el desarrollo

- No uses `yarn add` ni `npm install` dentro de un workspace.
- Para agregar una dependencia a un paquete, usa:

```bash
lerna add <paquete> --scope=@andes/<workspace>
```

- Si cambias tipos compartidos o imports internos, revisa tambien el mapeo de paths en `tsconfig.json`.
- Si trabajas sobre APIs basadas en Mongoose, arranca por `core/src/model-builder` y `api-tool/src/bootstrap`.
- Si tocas testing, evita reintroducir `babel-jest` en paquetes que solo corren tests TypeScript.
- Los tests Mongo que quedaron estabilizados en Node 18 usan `mongodb-memory-server-global@8.16.1` con `MongoMemoryServer.create(...)`, MongoDB `7.0.24` y `storageEngine: 'wiredTiger'`.
- `fuentes-autenticas` ahora tiene snapshots versionados en `src/__snapshots__/`.
- CircleCI ya quedo alineado con Node `18.20.8` usando `cimg/node:18.20.8`.
