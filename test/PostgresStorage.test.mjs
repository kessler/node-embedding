import test from 'ava'
import PostgresStorage from '../lib/PostgresStorage.mjs'

test('add() entries to storage', async t => {
  const { storage } = t.context
  // have to do this ugliness, since in PostgresStorage i do new pg.default.Pool() ...
  const pool = storage._pool
  const embedding = mockEmbedding()

  await storage.add('data', 'test', embedding, { foo: 1 })

  t.is(pool.clients.length, 1)
  const [client] = pool.clients
  t.true(client.released)
  t.is(client.queries.length, 1)
  const [{ sql, args }] = client.queries
  t.is(sql, 'INSERT INTO documents (id, collection_name, content, embedding, metadata) VALUES($1, $2, $3, $4, $5)')

  const [id, collectionName, content, emb, metadata] = args

  t.true(typeof id === 'string')
  t.is(id.length, 26)

  t.is(collectionName, 'data')
  t.is(content, 'test')
  t.is(emb, `[${embedding.join(',')}]`)
  t.deepEqual(metadata, { foo: 1 })
})

test('delete() entries from storage', async t => {
  const { storage } = t.context
  const pool = storage._pool

  await storage.delete('data', 'id123')

  t.is(pool.clients.length, 1)
  const [client] = pool.clients
  t.true(client.released)
  t.is(client.queries.length, 1)
  const [{ sql, args }] = client.queries
  t.is(sql, 'DELETE from documents WHERE id=$1')
  t.deepEqual(args, ['id123'])
})

test('get() entries from storage', async t => {
  const { storage } = t.context
  const pool = storage._pool

  await storage.get('data', 'id123')

  t.is(pool.clients.length, 1)
  const [client] = pool.clients
  t.true(client.released)
  t.is(client.queries.length, 1)
  const [{ sql, args }] = client.queries
  t.is(sql, 'SELECT id, metadata, content, embedding from documents WHERE id=$1')
  t.deepEqual(args, ['id123'])
})

test('query() entries from storage', async t => {
  const { storage } = t.context
  const pool = storage._pool
  const embedding = mockEmbedding()
  await storage.query('data', embedding, { maxResults: 1, threshold: 0.9 })

  t.is(pool.clients.length, 1)
  const [client] = pool.clients
  t.true(client.released)
  t.is(client.queries.length, 1)
  const [{ sql, args }] = client.queries
  t.is(sql, 'SELECT id, content, metadata, similarity FROM match_documents($1, $2, $3, $4)')
  t.deepEqual(args, ['data', `[${embedding.join(',')}]`, 0.9, 1])
})

test.skip('query() entries from storage with maxResults', async t => {

})


test.beforeEach(t => {
  const storage = new PostgresStorage(new MockPG())
  t.context = {
    storage
  }
})

class MockPG {
  get default() {
    return {
      Pool: MockPool,
      escapeIdentifier: v => v
    }
  }
}

class MockPool {
  constructor() {
    this.clients = []
  }

  async connect() {
    const client = new MockClient()
    this.clients.push(client)
    return Promise.resolve(client)
  }
}

class MockClient {
  constructor() {
    this.queries = []
  }

  async query(sql, args) {
    this.queries.push({ sql, args })

    if (sql === 'SELECT id, metadata, content, embedding from documents WHERE id=$1'
      || sql === 'SELECT id, content, metadata, similarity FROM match_documents($1, $2, $3, $4)')
      return Promise.resolve({ rows: [] })
  }

  async release() {
    this.released = true
    return Promise.resolve()
  }
}

function mockEmbedding() {
  const result = []
  for (let i = 0; i < 1536; i++) {
    result.push(i)
  }

  return result
}