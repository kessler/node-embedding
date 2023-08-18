import { mkdirp } from 'mkdirp'
import path from 'node:path'
import {
  cosineSimilarity,
  similarityArraySort,
  mapToJSON,
  jsonToMap
} from './util.mjs'

export default class FileSystemStorage {
  constructor(fs, { directory }) {
    this._directory = directory
    this._collections = undefined
    this._fs = fs
    this._collections = new Map()
  }

  async query(collectionName, embedding, { maxResults, threshold }) {
    const collectionData = await this._lazyLoad(collectionName)
    const similarities = []
    
    for (const entry of collectionData.values()) {
      const similarity = cosineSimilarity(embedding, entry.embedding)
      if (similarity >= threshold) {
        similarities.push({ similarity, text: entry.text, metadata: entry.metadata })
      }
    }

    similarities.sort(similarityArraySort)

    return similarities.length > maxResults ? similarities.slice(0, maxResults) : similarities
  }

  async add(collectionName, text, embedding, metadata) {
    const collectionData = await this._lazyLoad(collectionName)
    collectionData.set(embedding, { text, embedding, metadata })
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

  async init() {
    return mkdirp(this._directory)
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
