// Downloads the WebLLM model-library .wasm files used by the chat into public/webllm/,
// so visitors load them from this site instead of raw.githubusercontent.com (slow / rate-limited).
// Model weights still come from Hugging Face. Run once: npm run fetch-llm-libs
import fs from "node:fs";
import path from "node:path";
import { prebuiltAppConfig, modelVersion } from "@mlc-ai/web-llm";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const MODELS = ["Qwen2.5-0.5B-Instruct", "Qwen2.5-1.5B-Instruct"].flatMap((m) => [`${m}-q4f16_1-MLC`, `${m}-q4f32_1-MLC`]);
const outDir = path.join(ROOT, "public", "webllm", modelVersion);
fs.mkdirSync(outDir, { recursive: true });

for (const id of MODELS) {
  const rec = prebuiltAppConfig.model_list.find((m) => m.model_id === id);
  if (!rec) throw new Error(`Unknown WebLLM model ${id}`);
  const file = rec.model_lib.split("/").pop();
  const dest = path.join(outDir, file);
  if (fs.existsSync(dest)) {
    console.log(`✓ ${file} (cached)`);
    continue;
  }
  const urls = [
    rec.model_lib.replace("https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/", "https://cdn.jsdelivr.net/gh/mlc-ai/binary-mlc-llm-libs@main/"),
    rec.model_lib,
  ];
  let ok = false;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.subarray(0, 4).toString("hex") !== "0061736d") throw new Error("not a wasm file");
      fs.writeFileSync(dest, buf);
      console.log(`↓ ${file} (${(buf.length / 1e6).toFixed(1)} MB) from ${new URL(url).host}`);
      ok = true;
      break;
    } catch (e) {
      console.warn(`  ${file} from ${new URL(url).host} failed: ${e.message}`);
    }
  }
  if (!ok) console.warn(`✗ ${file}: not downloaded — the chat will fall back to WebLLM's default URL for ${id}.`);
}
