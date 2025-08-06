import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import arg from "arg";
import { marked } from "marked";
import matter from "gray-matter";
import { sendEmail } from "./ses";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const FROM_NAME = "Alex Harri";
const FROM_EMAIL = "alex@alexharri.com";
const REGION = "eu-north-1";

function getRecipients() {
  const content = fs.readFileSync(path.resolve(__dirname, "recipients"), "utf-8");
  return content
    .split("\n")
    .map((email) => email.trim())
    .filter(Boolean)
    .map((email) => {
      if (!email.includes("@")) {
        throw new Error(`Invalid email address: ${email}`);
      }
      return email;
    });
}

async function loadEmailContent(contentFile: string): Promise<{ subject: string; body: string }> {
  const fileName = contentFile.endsWith(".md") ? contentFile : `${contentFile}.md`;
  const filePath = path.join(process.cwd(), "scripts/email/email-content", fileName);
  const fileContent = fs.readFileSync(filePath, "utf-8");

  const { data, content } = matter(fileContent);

  if (!data.subject) {
    throw new Error(`Frontmatter must contain a 'subject' field`);
  }

  const subject = data.subject;
  const body = await marked.parse(content);

  return { subject, body };
}

async function main() {
  const args = arg({
    "--content": String,
    "-c": "--content",
  });

  if (!args["--content"]) {
    console.error("Usage: npm run send-email -- --content=<filename>");
    process.exit(1);
  }

  const contentFile = args["--content"];
  const { subject, body } = await loadEmailContent(contentFile);

  const recipients = getRecipients();

  if (recipients.length === 0) {
    console.error("No recipients found");
    process.exit(1);
  }

  console.log(`Sending "${subject}" to ${recipients.length} recipients...`);

  await sendEmail({
    recipients,
    subject,
    htmlBody: body,
    fromEmail: FROM_EMAIL,
    fromName: FROM_NAME,
    region: REGION,
  });

  console.log("✓ Email sent successfully");
}

main().catch(console.error);
