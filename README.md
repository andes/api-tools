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

## Estado validado hoy

Con Node 18 quedaron validados estos pasos:

```bash
nvm use 18
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
```

Ademas, el comando por workspace tambien funciona en `api-tool`:

```bash
yarn test --scope=@andes/api-tool
```

El test global del monorepo (`yarn test`) todavia no esta estabilizado: hoy avanza en varios paquetes, pero queda trabado al llegar a `@andes/mongoose-plugin-audit`.

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

1. Instalar dependencias:

```bash
nvm use 18
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
cd core && yarn test --runInBand src/query-builder/select.spec.ts
```

## Estado actual de la actualizacion

Hoy el build del monorepo ya esta estabilizado en Node 18:

- `yarn install` funciona
- `yarn prepare` funciona
- `yarn lint` funciona

El foco que sigue es completar la estabilizacion del stack de tests:

- mantener verdes los tests puros de TypeScript
- aislar y corregir el cuelgue actual de `@andes/mongoose-plugin-audit`
- seguir revisando los tests integrados con Mongo que todavia necesitan investigacion aparte
- despues de eso, evaluar si conviene subir runtime o tooling otra vez

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
