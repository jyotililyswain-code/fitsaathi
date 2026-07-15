import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true
  }
};

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  try {
    const { app } = await import("@/server/src/app");
    return app(request, response);
  } catch (error) {
    console.error("api.catch_all_failed", error);
    if (!response.headersSent) {
      response.status(500).json({
        error: "The API could not start. Please try again shortly.",
        code: "API_STARTUP_FAILED"
      });
    }
  }
}
