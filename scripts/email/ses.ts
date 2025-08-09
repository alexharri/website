import {
  SESClient,
  SendBulkTemplatedEmailCommand,
  CreateTemplateCommand,
  DeleteTemplateCommand,
} from "@aws-sdk/client-ses";

export async function sendEmail({
  recipients,
  subject,
  htmlBody,
  fromEmail,
  fromName,
  region,
}: {
  recipients: string[];
  subject: string;
  htmlBody: string;
  fromEmail: string;
  fromName: string;
  region: string;
}) {
  const sesClient = new SESClient({ region });
  const templateName = `newsletter-${Date.now()}`;

  await createEmailTemplate(sesClient, templateName, subject, htmlBody);

  try {
    await sendBulkEmail(sesClient, recipients, templateName, fromEmail, fromName);
  } finally {
    try {
      await deleteEmailTemplate(sesClient, templateName);
    } catch (error) {
      console.error(`Warning: Failed to delete email template "${templateName}":`, error);
    }
  }
}

async function createEmailTemplate(
  sesClient: SESClient,
  templateName: string,
  subject: string,
  body: string,
): Promise<void> {
  const command = new CreateTemplateCommand({
    Template: {
      TemplateName: templateName,
      SubjectPart: subject,
      HtmlPart: body,
    },
  });
  await sesClient.send(command);
}

async function sendBulkEmail(
  sesClient: SESClient,
  toEmails: string[],
  templateName: string,
  fromEmail: string,
  fromName: string,
): Promise<void> {
  // AWS limits to 50 per batch
  const batches = createBatches(toEmails, 50);

  console.log(`Sending to ${toEmails.length} recipients in ${batches.length} batch(es)`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const start = i * 50 + 1;
    const end = start + batch.length - 1;

    console.log(`Sending batch ${i + 1}/${batches.length} (emails ${start}-${end})`);

    const command = new SendBulkTemplatedEmailCommand({
      Source: `${fromName} <${fromEmail}>`,
      Template: templateName,
      Destinations: batch.map((email) => ({
        Destination: {
          ToAddresses: [email],
        },
        ReplacementTemplateData: "{}",
      })),
      DefaultTemplateData: "{}",
    });

    await sesClient.send(command);

    // Avoid hitting rate limit
    if (i < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
  }
}

function createBatches<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

async function deleteEmailTemplate(sesClient: SESClient, templateName: string): Promise<void> {
  const command = new DeleteTemplateCommand({ TemplateName: templateName });
  await sesClient.send(command);
}
