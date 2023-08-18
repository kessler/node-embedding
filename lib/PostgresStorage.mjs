import { monotonicFactory } from 'ulidx'
import { CommandQueue, Command, haltCommand } from '@kessler/command-queue'

export default class PostgresStorage {
  constructor(pg, {
    databaseName,
    documentTableName = 'documents',
    matchFunctionName = 'match_documents'
  }) {
    this._newId = monotonicFactory()
    this._databaseName = databaseName
    this._documentTableName = documentTableName
    this._matchFunctionName = matchFunctionName
  }

  async query(embedding, { maxResults, threshold }) {

  }

  async add(text, embedding, metadata) {

    //return { id: embedding }
  }

  async delete(id) {

  }

  async get(id) {

  }

  async init() {
    
  }
}

class QueryCommand extends Command {
  constructor(client, sql, args) {
    this._client = client
    this._sql = sql
    this._args = args
  }

  execute() {

  }

  undo() {
    throw new Error('cannot undo')
  }
}