import fs from 'node:fs/promises'

import {
  cosineSimilarity,
  similarityArraySort,
  mapToJSON,
  jsonToMap
} from './util.mjs'

export default class SimpleStorage {
  constructor({ filename, _fs = undefined }) {
    this._filename = filename
    this._data = undefined
    this._fs = _fs || fs
  }

  async query(embedding, { maxResults, threshold }) {
    await this._lazyLoad()
    const similarities = []

    for (const entry of this._data.values()) {
      const similarity = cosineSimilarity(embedding, entry.embedding)
      if (similarity >= threshold) {
        similarities.push({ similarity, text: entry.text, metadata: entry.metadata })
      }
    }

    similarities.sort(similarityArraySort)

    return similarities.length > maxResults ? similarities.slice(0, maxResults) : similarities
  }

  async add(text, embedding, metadata) {
    await this._lazyLoad()
    this._data.set(embedding, { text, embedding, metadata })
    await this._save()

    return { id: embedding }
  }

  async delete(id) {
    await this._lazyLoad()
    this._data.delete(id)
    await this._save()
  }

  async get(id) {
    await this._lazyLoad()
    return this._data.get(id)
  }

  async _lazyLoad() {
    if (!this._data) {
      try {
        this._data = await this._load()
      } catch (e) {
        if (e.code === 'ENOENT') {
          this._data = new Map()
        } else {
          throw e
        }
      }
    }
  }

  async _load() {
    return jsonToMap(await this._fs.readFile(this._filename, 'utf8'))
  }

  async _save() {
    await this._fs.writeFile(this._filename, mapToJSON(this._data))
  }
}