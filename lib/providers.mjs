import OpenAIEmbedder from './OpenAIEmbedder.mjs'
import FileSystemStorage from './FileSystemStorage.mjs'
import PostgresStorage from './PostgresStorage.mjs'
import path from 'node:path'
import os from 'node:os'

// this might be externalized in the future
const embedderProviders = [{
  name: 'openai',
  class: OpenAIEmbedder
}]

const storageProviders = [{
  name: 'fs',
  class: FileSystemStorage,
},{
  name: 'pg',
  class: PostgresStorage
}]

export default async function loadProviders(config = {}, initialize = true) {

  const init = async (providers, map = new Map()) => {
    for (const providerSpec of providers) {
      try {
        const underlyingProvider = await import(providerSpec.name)
        const provider = new providerSpec.class(underlyingProvider, config[providerSpec.name])
        if (initialize) {
          await provider.init()
        }
        map.set(providerSpec.name, provider)
      } catch (e) {
        if (e.code !== 'ERR_MODULE_NOT_FOUND') {
          throw e
        }
      }
    }

    return map
  }

  const embedders = await init(embedderProviders)
  const storage = await init(storageProviders)

  return { embedders, storage }
}

function loadModule(name) {
  try {
    return import(name)
  } catch (e) {
    console.error(`trying to load module ${name} and failed, this might be ok`, e)
  }
}