import type { NextApiRequest, NextApiResponse } from "next";
import { app } from "@/server/src/app";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true
  }
};

export default function handler(request: NextApiRequest, response: NextApiResponse) {
  return app(request, response);
}
