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
  const command = new SendBulkTemplatedEmailCommand({
    Source: `${fromName} <${fromEmail}>`,
    Template: templateName,
    Destinations: toEmails.map((email) => ({
      Destination: {
        ToAddresses: [email],
      },
      ReplacementTemplateData: "{}",
    })),
    DefaultTemplateData: "{}",
  });
  await sesClient.send(command);
}

async function deleteEmailTemplate(sesClient: SESClient, templateName: string): Promise<void> {
  const command = new DeleteTemplateCommand({ TemplateName: templateName });
  await sesClient.send(command);
}
