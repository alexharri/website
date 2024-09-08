import type { NextApiRequest, NextApiResponse } from "next";
import { emailRegex } from "../../../utils/regex";

const { AIRTABLE_MAILING_LIST_BASE_ID, AIRTABLE_MAILING_LIST_TABLE_ID, AIRTABLE_API_TOKEN } =
  process.env;

async function isSubscribed(email: string) {
  const formula = encodeURIComponent(`{Email}="${email}"`);
  const result = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_MAILING_LIST_BASE_ID}/${AIRTABLE_MAILING_LIST_TABLE_ID}?filterByFormula=${formula}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
      },
    },
  );
  if (result.status !== 200) {
    throw new Error(`Searching for records failed with status code ${result.status}`);
  }
  const { records } = await result.json();
  if (!Array.isArray(records)) {
    throw new Error(`Expected 'records' to be an array.`);
  }
  return records.length > 0;
}

async function subscribe(email: string) {
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
  return result.status === 200;
}

export default async function subscribeHandler(req: NextApiRequest, res: NextApiResponse) {
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
    const alreadySubscribed = await isSubscribed(email);
    if (alreadySubscribed) {
      res.status(200).end();
      return;
    }

    const ok = await subscribe(email);
    if (!ok) {
      res.status(500).json({ error: { message: "Failed to subscribe" } });
      return;
    }

    res.status(200).end();
  } catch (e) {
    console.log(e);
    res.status(500).end();
  }
}
