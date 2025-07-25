import serverless from "serverless-http";

// In production, use the built server
import { createServer } from "../../server/index.js";

export const handler = serverless(createServer());
