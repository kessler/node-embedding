import test from 'ava'
import SimpleStorage from '../lib/SimpleStorage.mjs'

test('add() entries to storage', async t => {
  const mockFs = new MockFS()
  const storage = new SimpleStorage('test/data.json', mockFs)
  await storage.add('test', [1, 2, 3], { foo: 1 })
  t.is(mockFs.filename, 'test/data.json')
  t.is(mockFs.data, '[[[1,2,3],{"text":"test","embedding":[1,2,3],"metadata":{"foo":1}}]]')
})

test('delete() entries from storage', async t => {
  const mockFs = new MockFS()
  const storage = new SimpleStorage('test/data.json', mockFs)
  const { id } = await storage.add('test', [1, 2, 3], { foo: 1 })
  await storage.delete(id)
  t.is(mockFs.data, '[]')
})

test('get() entries from storage', async t => {
  const mockFs = new MockFS()
  const storage = new SimpleStorage('test/data.json', mockFs)
  const { id } = await storage.add('test', [1, 2, 3], { foo: 1 })
  const entry = await storage.get(id)
  t.deepEqual(entry, { text: 'test', embedding: [1, 2, 3], metadata: { foo: 1 } })
})

test.only('query() entries from storage', async t => {
  const mockFs = new MockFS('[[[1,2,3],{"text":"test","embedding":[1,2,3],"metadata":{"foo":1}}]]')
  const storage = new SimpleStorage('test/data.json', mockFs)
  const results = await storage.query([1, 2, 3], { maxResults: 10, threshold: 0.8 })
  
  t.deepEqual(results, [{ similarity: 1, text: 'test', metadata: { foo: 1 } }])
})


class MockFS {
  constructor(data = '[]') {
    this.data = data
  }

  async readFile() {
    return this.data
  }

  async writeFile(filename, data) {
    this.filename = filename
    this.data = data
  }
}