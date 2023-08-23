# @kessler/embedding (WIP)

This module is built to allow progressive advancement from simple json based embedding database to more advanced solutions like chroma or redis.

## Collections

Collections are the highest abstraction layer. They group together documents, their embedding data and some optional metadata.

```js
class Collection {
  constructor(name, embeddingService, storage) {}
  async query(text, { maxResults = Infinity, threshold = 0.8 }) {}
  async add(text, metadata) {}
  async delete(id) {}
  async get(id) {}
}
```

## Providers

There are two categories for providers: `embedding` and `storage`. Embedding providers expose embedding services through a unified interface and storage providers do the same, just for storing and querying documents.

Providers can be loaded and created manually by importing their classes and instantiating them or they can be loaded through ```loadProviders``` (see below)

Once a provider is loaded you should call it's ```init``` method, regardless of wether you loaded it manually or through load providers. (_TODO: i might want to change this behavior_)

### embedding provider

```js
class Embedder {
  constructor(underlyingProvider, config) {}
  async exec(text, metadata) {}
  async init() {}
}
```

_TODO: once a document is embedding with one service and stored, the embedding provider cannot be changed, if the embedding scheme is different in the new provider. This must be addressed some how in the design._

### storage provider

```js
class MyStorage {
  constructor(underlyingProvider, config) {}
  async query(embedding, { maxResults, threshold }) {}
  async add(text, embedding, metadata) {}
  async delete(id) {}
  async get(id) {}
  async init() {}
}
```

### loading automatically

the intent of ```loadProviders``` is to load and instatiate any provider that can be loaded, meaning that their peer dependencies exist.

```js
import { loadProviders } from '@kessler/embedding'

async function main() {
  const { storage, embedders } = await loadProviders({ /* ...providers config */ })

  await storage.pg.init()
}

main()
```

### loading manually

### embedding providers

### storage providers

## resources
- https://supabase.com/blog/openai-embeddings-postgres-vector
