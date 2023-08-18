export default class Collection {
  constructor(name, embeddingService, storage) {
    this._name = name
    this._embeddingService = embeddingService
    this._storage = storage
  }

  async query(text, { maxResults = Infinity, threshold = 0.8 }) {
    const embedding = await this._embeddingService.exec(text)
    return await this._storage.query(this._name, embedding, { maxResults, threshold })
  }

  async add(text, metadata) {
    const embedding = await this._embeddingService.exec(text, metadata)
    return await this._storage.add(this._name, text, embedding, metadata)
  }

  async delete(id) {
    await this._storage.delete(this._name, id)
  }

  async get(id) {
    return await this._storage.get(this._name, id)
  }
}
