import OpenAIEmbedder from './OpenAIEmbedder.mjs'

// this might be externalized in the future
const embedderProviders = [{ 
  name: 'openai', 
  class: OpenAIEmbedder
}]

export function loadClasses(config) {
  const embedders = new Map()

  for (const providerSpec of embedderProviders) {
    const provider = await import(providerSpec.name)
    embedders.set(providerSpec.name, new providerSpec.class(provider, config[providerSpec.name]))
  }
}

function loadModule(name) {
  try {
    return import(name)
  } catch (e) {
    console.error(`trying to load module ${name} and failed, this might be ok`, e)
  }
}