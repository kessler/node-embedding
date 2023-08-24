import { monotonicFactory } from 'ulidx'
import pgvector from 'pgvector/pg'
import BaseStorage from './BaseStorage.mjs'

const ulidx = monotonicFactory()

// resources
// https://github.com/pgvector/pgvector
// https://supabase.com/blog/openai-embeddings-postgres-vector

export default class PostgresStorage extends BaseStorage {
  constructor(pg, {
    documentTableName = 'documents',
    matchFunctionName = 'match_documents',

    //https://node-postgres.com/features/connecting
    databaseConfig = {
      user: 'embedding',
      host: 'localhost',
      database: 'embedding',
      password: '',
      port: 5432
    }
  } = {}) {
    super()
    this._pool = new pg.default.Pool(databaseConfig)
    this._newId = monotonicFactory()
    this._documentTableName = pg.default.escapeIdentifier(documentTableName)
    this._matchFunctionName = matchFunctionName
  }

  async query(collectionName, embedding, { maxResults = 1000, threshold = 0.8 } = {}) {
    const [client, onFinish] = await this._client()
    const result = await client.query('SELECT id, content, metadata, similarity FROM match_documents($1, $2, $3, $4)', [collectionName, pgvector.toSql(embedding), threshold, maxResults])
    await onFinish()
    return result.rows
  }

  async add(collectionName, content, embedding, metadata) {
    // when we have other embedders, we'll need to support this
    // and during add or query operations, select the right column...
    if (embedding.length !== 1536) {
      throw new TypeError('currently only embedding vectors of length 1536 are supported')
    }

    const [client, onFinish] = await this._client()
    const id = ulidx()
    const args = [id, collectionName, content, pgvector.toSql(embedding), metadata]
    await client.query(`INSERT INTO ${this._documentTableName} (id, collection_name, content, embedding, metadata) VALUES($1, $2, $3, $4, $5)`, args)
    await onFinish()
    return { id }
  }

  async delete(collectionName, id) {
    const [client, onFinish] = await this._client()
    // adding the collection name to the query is 
    // redundant as ids are unique in the table
    await client.query(`DELETE from ${this._documentTableName} WHERE id=$1`, [id])
    await onFinish()
  }

  async get(collectionName, id) {
    const [client, onFinish] = await this._client()
    // adding the collection name to the query is 
    // redundant as ids are unique in the table
    const result = await client.query(`SELECT id, metadata, content, embedding from ${this._documentTableName} WHERE id=$1`, [id])
    await onFinish()

    return result.rows[0]
  }

  async collections() {
    const [client, onFinish] = await this._client()
    // adding the collection name to the query is 
    // redundant as ids are unique in the table
    const result = await client.query(`SELECT distinct collection_name from ${this._documentTableName}`)
    await onFinish()

    return result.rows.map(row => row.collection_name)
  }

  async init() {
    this._pool.on('connect', async function (client) {
      await pgvector.registerType(client)
    })
    
    const [client, onFinish] = await this._client()

    try {
      await client.query('CREATE EXTENSION vector')
    } catch (e) {
      if (e.message !== 'extension "vector" already exists') {
        throw e
      }
    }

    await client.query(`
create table if not exists ${this._documentTableName} (
  id varchar(26) primary key,
  collection_name text,
  metadata json,
  content text,
  embedding vector(1536) 
)`)

    await client.query(`
create or replace function match_documents (
  collection_name text,
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id varchar(26),
  content text,
  metadata json,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from ${this._documentTableName} as documents
  where 
    documents.collection_name = collection_name and
    1 - (documents.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$`)

    await onFinish()
  }

  async shutdown() {
    return this._pool.end()
  }

  async _client() {
    const client = await this._pool.connect()
    return [client, () => client.release()]
  }
}
