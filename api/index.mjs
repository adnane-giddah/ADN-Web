// Vercel entry point. vercel.json sends every /api/* request here.
import { createApi } from '../server/api.mjs';

const handleApi = createApi();

export default async function handler(req, res) {
  await handleApi(req, res);
}
