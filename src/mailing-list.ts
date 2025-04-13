import assert from "assert";

interface Record {
  id: string;
  createdTime: string;
  fields: { Email: string };
}

export class MailingList {
  private baseId: string;
  private tableId: string;
  private apiToken: string;

  constructor() {
    const {
      AIRTABLE_MAILING_LIST_BASE_ID: baseId,
      AIRTABLE_MAILING_LIST_TABLE_ID: tableId,
      AIRTABLE_API_TOKEN: apiToken,
    } = process.env;
    assert(baseId && tableId && apiToken);
    this.baseId = baseId;
    this.tableId = tableId;
    this.apiToken = apiToken;
  }

  public async subscribe(email: string): Promise<void> {
    const alreadySubscribed = await this.isSubscribed(email);
    if (alreadySubscribed) return;
    const result = await fetch(`https://api.airtable.com/v0/${this.baseId}/${this.tableId}`, {
      method: "POST",
      body: JSON.stringify({ fields: { Email: email } }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiToken}`,
      },
    });
    if (result.status !== 200) {
      console.log("Airtable response: " + (await result.text()));
      throw new Error(`Failed to create Airtable record with status ${result.status}`);
    }
  }

  public async unsubscribe(email: string): Promise<void> {
    const records = await this.getRecordsWithEmail(email);
    for (const record of records) {
      const result = await fetch(
        `https://api.airtable.com/v0/${this.baseId}/${this.tableId}/${record.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${this.apiToken}` },
        },
      );
      if (result.status !== 200) {
        console.log("Airtable response: " + (await result.text()));
        throw new Error(
          `Failed to delete Airtable record '${record.id}' with status ${result.status}`,
        );
      }
    }
  }

  private async isSubscribed(email: string) {
    const records = await this.getRecordsWithEmail(email);
    return records.length > 0;
  }

  private async getRecordsWithEmail(email: string) {
    const formula = encodeURIComponent(`{Email}="${email}"`);
    const result = await fetch(
      `https://api.airtable.com/v0/${this.baseId}/${this.tableId}?filterByFormula=${formula}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${this.apiToken}` },
      },
    );
    if (result.status !== 200) {
      throw new Error(`Searching for records failed with status code ${result.status}`);
    }
    const { records } = (await result.json()) as { records: Record[] };
    if (!Array.isArray(records)) {
      throw new Error(`Expected 'records' to be an array.`);
    }
    return records;
  }
}
