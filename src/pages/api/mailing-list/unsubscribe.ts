import type { NextApiRequest, NextApiResponse } from "next";
import { emailRegex } from "../../../utils/regex";
import { MailingList } from "../../../mailing-list";

export default async function unsubscribeHandler(req: NextApiRequest, res: NextApiResponse) {
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
    const mailingList = new MailingList();
    await mailingList.unsubscribe(email);
    res.status(200).end();
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: { message: "Failed to unsubscribe" } });
  }
}
