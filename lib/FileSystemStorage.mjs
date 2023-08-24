import BaseStorage from './BaseStorage.mjs'
import { mkdirp } from 'mkdirp'
import path from 'node:path'
import {
  cosineSimilarity,
  similarityArraySort,
  mapToJSON,
  jsonToMap
} from './util.mjs'

export default class FileSystemStorage extends BaseStorage {
  constructor(fs, { directory }) {
    super()
    this._directory = directory
    this._collections = undefined
    this._fs = fs
    this._collections = new Map()
  }

  // TODO: this is only good for small collections
  async query(collectionName, embedding, { maxResults, threshold }) {
    const collectionData = await this._lazyLoad(collectionName)
    const similarities = []

    for (const entry of collectionData.values()) {
      const similarity = cosineSimilarity(embedding, entry.embedding)
      if (similarity >= threshold) {
        similarities.push({ id: entry.embedding, similarity, content: entry.content, metadata: entry.metadata })
      }
    }

    similarities.sort(similarityArraySort)

    return similarities.length > maxResults ? similarities.slice(0, maxResults) : similarities
  }

  async add(collectionName, content, embedding, metadata) {
    const collectionData = await this._lazyLoad(collectionName)
    collectionData.set(embedding, { id: embedding, content, embedding, metadata })
    await this._save(collectionName)

    return { id: embedding }
  }

  async delete(collectionName, id) {
    const collectionData = await this._lazyLoad(collectionName)
    collectionData.delete(id)
    await this._save(collectionName)
  }

  async get(collectionName, id) {
    const collectionData = await this._lazyLoad(collectionName)
    return collectionData.get(id)
  }

  async collections() {
    const files = await this._fs.readdir(this._directory)
    return files.filter(f => f.endsWith('.json')).map(f => f.substr(0, f.length - 5))
  }

  async init() {
    return mkdirp(this._directory)
  }

  async shutdown() {
    // nothing to do
    return Promise.resolve()
  }

  async _lazyLoad(collectionName) {
    let collectionData = this._collections.get(collectionName)
    if (!collectionData) {
      try {
        collectionData = await this._load(collectionName)
      } catch (e) {
        if (e.code === 'ENOENT') {
          collectionData = new Map()
        } else {
          throw e
        }
      }
      this._collections.set(collectionName, collectionData)
    }

    return collectionData
  }

  async _load(collectionName) {
    return jsonToMap(await this._fs.readFile(this._toCollectionFilename(collectionName), 'utf8'))
  }

  async _save(collectionName) {
    await this._fs.writeFile(this._toCollectionFilename(collectionName), mapToJSON(this._collections.get(collectionName)))
  }

  _toCollectionFilename(collectionName) {
    return path.join(this._directory, `${collectionName}.json`)
  }
}