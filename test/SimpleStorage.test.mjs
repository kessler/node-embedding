import test from 'ava'
import SimpleStorage from '../lib/SimpleStorage.mjs'

test('add() entries to storage', async t => {
  const { mockFs, storage } = t.context
  
  await storage.add('data', 'test', [1, 2, 3], { foo: 1 })
  t.is(mockFs.writeFilename, 'test/data.json')
  t.is(mockFs.readFilename, 'test/data.json')
  t.is(mockFs.data, '[[[1,2,3],{"text":"test","embedding":[1,2,3],"metadata":{"foo":1}}]]')
})

test('delete() entries from storage', async t => {
  const { mockFs, storage } = t.context
  
  const { id } = await storage.add('data', 'test', [1, 2, 3], { foo: 1 })
  await storage.delete('data', id)
  t.is(mockFs.data, '[]')
})

test('get() entries from storage', async t => {
  const { mockFs, storage } = t.context
  
  const { id } = await storage.add('data', 'test', [1, 2, 3], { foo: 1 })
  const entry = await storage.get('data', id)
  t.deepEqual(entry, { text: 'test', embedding: [1, 2, 3], metadata: { foo: 1 } })
})

test('query() entries from storage', async t => {
  const { mockFs, storage } = t.context
  mockFs.data = '[[[1,2,3],{"text":"test","embedding":[1,2,3],"metadata":{"foo":1}}]]'
  const results = await storage.query('data', [1, 2, 3], { maxResults: 10, threshold: 0.8 })
  
  t.deepEqual(results, [{ similarity: 1, text: 'test', metadata: { foo: 1 } }])
})

test.skip('query() entries from storage with maxResults', async t => {

})

test.beforeEach(t => {
  const mockFs = new MockFS()
  const storage = new SimpleStorage(mockFs, { directory: 'test' })
  t.context = {
    mockFs, storage
  }
})

class MockFS {
  constructor(data = '[]') {
    this.data = data
  }

  async readFile(filename) {
    this.readFilename = filename
    return this.data
  }

  async writeFile(filename, data) {
    this.writeFilename = filename
    this.data = data
  }
}