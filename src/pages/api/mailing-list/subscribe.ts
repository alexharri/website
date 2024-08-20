import type { NextApiRequest, NextApiResponse } from "next";
import { emailRegex } from "../../../utils/regex";

const { AIRTABLE_MAILING_LIST_BASE_ID, AIRTABLE_MAILING_LIST_TABLE_ID, AIRTABLE_API_TOKEN } =
  process.env;

export default async function subscribe(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  let body: any;
  try {
    body = JSON.parse(req.body) ?? {};
  } catch (e) {
    res.status(400).json({ message: "Request body must be JSON" });
    return;
  }

  const { email } = body;

  if (!emailRegex.test(email)) {
    res.status(400).json({ message: "Invalid email address in body" });
    return;
  }

  try {
    const result = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_MAILING_LIST_BASE_ID}/${AIRTABLE_MAILING_LIST_TABLE_ID}`,
      {
        method: "POST",
        body: JSON.stringify({ fields: { Email: email } }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
        },
      },
    );

    if (result.status === 200) {
      res.status(200).end();
      return;
    }

    res.status(500).json({ error: { message: "Failed to subscribe" } });
  } catch (e) {
    res.status(500).end();
  }
}
