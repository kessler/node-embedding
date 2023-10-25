export default class OpenAIEmbedder {
  constructor(openai, config) {
    const { OpenAI } = openai
    this._openai = new OpenAI({ apiKey: config.apiKey })
    this._model = config.model || 'text-embedding-ada-002'
  }

  async exec(text, metadata = {}) {
    const response = await this._openai.createEmbedding({
      model: this._model,
      input: text,
      user: metadata.user
    })

    return response.data?.data[0]?.embedding
  }

  async init() {
    // nothing to do
    return Promise.resolve()
  }

  async shutdown() {
    // nothing to do
    return Promise.resolve()
  }
}