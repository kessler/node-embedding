export default class BaseStorage {
  constructor(underlyingProvider, config) {}

  async query(collectionName, embedding, { maxResults = 1000, threshold = 0.8 } = {}) {
    throw new Error('must implement')
  }

  async add(collectionName, content, embedding, metadata) {
    throw new Error('must implement')
  }

  async delete(collectionName, id) {
    throw new Error('must implement')
  }

  async get(collectionName, id) {
    throw new Error('must implement')
  }

  async init() {
    throw new Error('must implement')
  }

  async shutdown() {
    throw new Error('must implement')
  }
  
  async collections() {
    throw new Error('must implement')
  }
}