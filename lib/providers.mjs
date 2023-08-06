import OpenAIEmbedder from './OpenAIEmbedder.mjs'
import SimpleStorage from './SimpleStorage.mjs'

// this might be externalized in the future
const embedderProviders = [{ 
  name: 'openai', 
  class: OpenAIEmbedder
}]

const storageProviders = [{
  name: 'simple',
  class: SimpleStorage,
}]

export default async function loadProviders(config) {
  const embedders = new Map()

  for (const providerSpec of embedderProviders) {
    const provider = await import(providerSpec.name)
    embedders.set(providerSpec.name, new providerSpec.class(provider, config[providerSpec.name]))
  }

  const storage = new Map()

  for (const providerSpec of storageProviders) {
    const provider = await import(providerSpec.name)
    storage.set(providerSpec.name, new providerSpec.class(provider, config[providerSpec.name]))
  }

  return { embedders, storage }
}

function loadModule(name) {
  try {
    return import(name)
  } catch (e) {
    console.error(`trying to load module ${name} and failed, this might be ok`, e)
  }
}