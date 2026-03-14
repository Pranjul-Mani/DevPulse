import { HfInference } from '@huggingface/inference';
import fs from 'fs';
import 'dotenv/config';

async function testHf() {
  const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
  try {
    const out = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: "my testing text here",
    });
    fs.writeFileSync('out.txt', 'SUCCESS: len ' + (Array.isArray(out) ? out.length : typeof out), 'utf8');
  } catch (err) {
    fs.writeFileSync('out.txt', 'ERR: ' + err.message, 'utf8');
  }
}
testHf();
