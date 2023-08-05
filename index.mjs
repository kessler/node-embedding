class Collection {
  constructor(embeddingService, storage) {
    this._embeddingService = embeddingService
    this._storage = storage
  }

  async query(text, { maxResults = Infinity, threshold = 0.8 }) {
    const embedding = await this._embeddingService.exec(text)
    return await this._storage.query(embedding, { maxResults, threshold })
  }

  async add(text, metadata) {
    const embedding = await this._embeddingService.exec(text)
    return await this._storage.add(text, embedding, metadata)
  }

  async delete(id) {
    await this._storage.delete(id)
  }

  async get(id) {
    return await this._storage.get(id)
  }
}
