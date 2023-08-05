// GPT analysis: 
// One suggestion that potentially provides a marginal improvement could be to combine the dot product and magnitude calculations into a single function to reduce looping through the arrays twice.
// But unless vecA and vecB are very large arrays, this tweak is unlikely to produce noticeable gains in performance. For smaller-size data, the original function isn't likely to cause any lag, and it's cleaner and easier to understand.
export function cosineSimilarity(vecA, vecB) {
  const dotProduct = dot(vecA, vecB)
  const magnitudeA = magnitude(vecA)
  const magnitudeB = magnitude(vecB)

  return dotProduct / (magnitudeA * magnitudeB)
}

function dot(vecA, vecB) {
  let product = 0
  for (let i = 0; i < vecA.length; i++) {
    product += vecA[i] * vecB[i]
  }

  return product
}

function magnitude(vec) {
  let sum = 0
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i]
  }

  return Math.sqrt(sum)
}

export function similarityArraySort(a, b) {
  return a.similarity - b.similarity
}

export function mapToJSON(map) {
  return JSON.stringify([...map])
}

export function jsonToMap(json) {
  return new Map(JSON.parse(json))
}