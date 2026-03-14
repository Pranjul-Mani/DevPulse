import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
const MODEL = "sentence-transformers/all-MiniLM-L6-v2";

export const generateEmbedding = async (text) => {
  try {
    const embedding = await hf.featureExtraction({
      model: MODEL,
      inputs: text.slice(0, 512),
    });
    return embedding;
  } catch (error) {
    throw new Error(`HuggingFace API error: ${error.message}`);
  }
};

export const generateEmbeddings = async (texts) => {
  const results = [];
  const batchSize = 10;

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((text) => generateEmbedding(text))
    );
    results.push(...batchResults);

    if (i + batchSize < texts.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return results;
};
