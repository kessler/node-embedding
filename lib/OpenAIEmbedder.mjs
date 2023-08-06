export default class OpenAIEmbedder {
  constructor(openai, config) {
    const { Configuration, OpenAIApi } = openai
    const configuration = new Configuration({ apiKey: config.apiKey })
    this._openai = new OpenAIApi(configuration)
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
}