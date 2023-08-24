import OpenAIEmbedder from './OpenAIEmbedder.mjs'
import FileSystemStorage from './FileSystemStorage.mjs'
import PostgresStorage from './PostgresStorage.mjs'
import path from 'node:path'
import os from 'node:os'

// this might be externalized in the future
const embedderProviders = [{
  module: 'openai',
  name: 'openai',
  class: OpenAIEmbedder
}]

const storageProviders = [{
  module: 'node:fs/promises',
  name: 'fs',
  class: FileSystemStorage,
},{
  module: 'pg',
  name: 'pg',
  class: PostgresStorage
}]

export default async function loadProviders(config = {}) {

  const load = async (category, specs, providers = {}) => {
    let count = 0
    for (const providerSpec of specs) {
      try {
        const underlyingProvider = await import(providerSpec.module)
        const provider = new providerSpec.class(underlyingProvider, config[providerSpec.name])
        providers[providerSpec.name] = provider
        count++
      } catch (e) {
        if (e.code !== 'ERR_MODULE_NOT_FOUND') {
          throw e
        }
      }
    }

    if (count === 0) {
      console.error(`WARNING: could not load any providers for ${category}`)
      throw new Error('cannot have zero providers in any category')
    }

    return providers
  }

  const embedders = await load('embedding', embedderProviders)
  const storage = await load('storage', storageProviders)

  return { embedders, storage }
}

function loadModule(name) {
  try {
    return import(name)
  } catch (e) {
    console.error(`trying to load module ${name} and failed, this might be ok`, e)
  }
}