const n8n_json = {
  name: "My workflow 2",
  nodes: [
    {
      parameters: {
        conditions: {
          options: {
            leftValue: "",
            caseSensitive: true,
            typeValidation: "loose",
          },
          combinator: "and",
          conditions: [
            {
              id: "401b79a0-a079-4ea0-805b-a963d9206031",
              operator: {
                name: "filter.operator.equals",
                type: "string",
                operation: "equals",
              },
              leftValue: "={{ $json.Status }}",
              rightValue: "Waiting for sending",
            },
            {
              id: "74ec18c7-e4cc-4d82-ba05-0ec4781cbb9f",
              operator: {
                type: "string",
                operation: "exists",
                singleValue: true,
              },
              leftValue: "={{ $json.Title }}",
              rightValue: "",
            },
            {
              id: "6e293a16-48cd-40bb-9882-09b456a97d58",
              operator: {
                type: "string",
                operation: "exists",
                singleValue: true,
              },
              leftValue: "={{ $json.Subject }}",
              rightValue: "",
            },
            {
              id: "a02d2518-e979-4a17-ab00-dda6723d9945",
              operator: {
                type: "string",
                operation: "exists",
                singleValue: true,
              },
              leftValue: "={{ $json.Email }}",
              rightValue: "",
            },
            {
              id: "bea4e49e-cf8a-4f05-bd6f-bdce0c5d8533",
              operator: {
                type: "string",
                operation: "exists",
                singleValue: true,
              },
              leftValue: "={{ $json.Name }}",
              rightValue: "",
            },
            {
              id: "e33eb064-34c6-4dea-b454-10f4fb7fe630",
              operator: {
                type: "string",
                operation: "exists",
                singleValue: true,
              },
              leftValue: "={{ $json.Date }}",
              rightValue: "",
            },
            {
              id: "1abe48e3-ba4d-4318-900d-fd58097d55ec",
              operator: {
                type: "dateTime",
                operation: "equals",
              },
              leftValue:
                "={{ DateTime.fromFormat($json[\"Date\"], 'yyyy/MM/dd').startOf('day')}}",
              rightValue: "={{ $now.startOf('day')}}",
            },
          ],
        },
        options: {
          looseTypeValidation: true,
        },
      },
      id: "91d19d50-50be-41be-88b7-9fdbabd86557",
      name: "Filter Status (Waiting for sending)",
      type: "n8n-nodes-base.filter",
      position: [1776, 640],
      typeVersion: 2,
    },
    {
      parameters: {
        fields: {
          values: [
            {
              name: "email",
              stringValue: "={{ $json.Email }}",
            },
            {
              name: "name",
              stringValue: "={{ $json.Name }}",
            },
            {
              name: "ID",
              stringValue: "={{ $json.ID }}",
            },
          ],
        },
        include: "selected",
        options: {},
      },
      id: "837f283e-671c-43fa-bb9e-2c3ae137bec1",
      name: "Set data",
      type: "n8n-nodes-base.set",
      position: [2400, 624],
      typeVersion: 3.2,
    },
    {
      parameters: {
        rule: {
          interval: [
            {
              field: "minutes",
              minutesInterval: 1,
            },
          ],
        },
      },
      id: "b637eafb-ead0-4c00-a582-86c6cbce51af",
      name: "Schedule Trigger",
      type: "n8n-nodes-base.scheduleTrigger",
      position: [1456, 640],
      typeVersion: 1.1,
    },
    {
      parameters: {
        operation: "append",
        documentId: {
          __rl: true,
          mode: "list",
          value: "126qQdkEWt_4Vkxvu6G80rBeFdIp_a8ISMz-898fa2D4",
          cachedResultUrl:
            "https://docs.google.com/spreadsheets/d/126qQdkEWt_4Vkxvu6G80rBeFdIp_a8ISMz-898fa2D4/edit?usp=drivesdk",
          cachedResultName: "Copy of Sending Messages to Customers",
        },
        sheetName: {
          __rl: true,
          mode: "list",
          value: "",
        },
      },
      id: "cf304d70-ad54-4380-ba96-4f3b69e8aef7",
      name: "Retrieve Customer Messages Data",
      type: "n8n-nodes-base.googleSheets",
      position: [1616, 640],
      typeVersion: 4.2,
    },
    {
      parameters: {
        operation: "update",
        documentId: {
          __rl: true,
          mode: "list",
          value: "126qQdkEWt_4Vkxvu6G80rBeFdIp_a8ISMz-898fa2D4",
          cachedResultUrl:
            "https://docs.google.com/spreadsheets/d/126qQdkEWt_4Vkxvu6G80rBeFdIp_a8ISMz-898fa2D4/edit?usp=drivesdk",
          cachedResultName: "Copy of Sending Messages to Customers",
        },
        sheetName: {
          __rl: true,
          mode: "list",
          value: "gid=0",
          cachedResultUrl:
            "https://docs.google.com/spreadsheets/d/126qQdkEWt_4Vkxvu6G80rBeFdIp_a8ISMz-898fa2D4/edit#gid=0",
          cachedResultName: "Page",
        },
        columns: {
          value: {
            ID: "={{ $json.ID }}",
            Status: "Sent successfully",
          },
          schema: [
            {
              id: "ID",
              type: "string",
              display: true,
              removed: false,
              required: false,
              displayName: "ID",
              defaultMatch: false,
              canBeUsedToMatch: true,
            },
            {
              id: "Name",
              type: "string",
              display: true,
              removed: true,
              required: false,
              displayName: "Name",
              defaultMatch: false,
              canBeUsedToMatch: true,
            },
            {
              id: "Email",
              type: "string",
              display: true,
              removed: true,
              required: false,
              displayName: "Email",
              defaultMatch: false,
              canBeUsedToMatch: true,
            },
            {
              id: "Date",
              type: "string",
              display: true,
              removed: true,
              required: false,
              displayName: "Date",
              defaultMatch: false,
              canBeUsedToMatch: true,
            },
            {
              id: "Status",
              type: "string",
              display: true,
              removed: false,
              required: false,
              displayName: "Status",
              defaultMatch: false,
              canBeUsedToMatch: true,
            },
            {
              id: "Title",
              type: "string",
              display: true,
              removed: true,
              required: false,
              displayName: "Title",
              defaultMatch: false,
              canBeUsedToMatch: true,
            },
            {
              id: "Subject",
              type: "string",
              display: true,
              removed: true,
              required: false,
              displayName: "Subject",
              defaultMatch: false,
              canBeUsedToMatch: true,
            },
            {
              id: "row_number",
              type: "string",
              display: true,
              removed: true,
              readOnly: true,
              required: false,
              displayName: "row_number",
              defaultMatch: false,
              canBeUsedToMatch: true,
            },
          ],
          mappingMode: "defineBelow",
          matchingColumns: ["ID"],
        },
        options: {},
      },
      id: "5fb91ef1-8fa8-4456-a3d5-ca542cd1dd7e",
      name: "Update Message Status",
      type: "n8n-nodes-base.googleSheets",
      position: [2592, 624],
      typeVersion: 4.2,
    },
    {
      parameters: {
        sendTo: "={{ $json.Email }}",
        subject: "={{ $json.Title }}",
        emailType: "text",
        message: "={{ $json.Subject }}",
        options: {},
      },
      id: "f094ad0e-2e1e-4cff-b978-6d5f4b3a1a6c",
      name: "Send a message (Gmail)",
      type: "n8n-nodes-base.gmail",
      position: [2000, 512],
      notesInFlow: false,
      typeVersion: 2.1,
      alwaysOutputData: false,
      webhookId: "d5e6936d-e46a-4cc2-8e13-a9d9c4f4af62",
    },
    {
      parameters: {
        mode: "combine",
        combinationMode: "mergeByPosition",
        options: {},
      },
      id: "ba64a770-baad-4007-b071-4e9565694e2d",
      name: "Merge fields",
      type: "n8n-nodes-base.merge",
      position: [2224, 624],
      typeVersion: 2.1,
    },
    {
      parameters: {
        path: "a8ffb4a0-1b93-4f05-8137-a924dafd6806",
        options: {},
      },
      type: "n8n-nodes-base.webhook",
      typeVersion: 2.1,
      position: [1568, 224],
      id: "f4d23107-2983-4479-af99-bad0851f0d0a",
      name: "Webhook",
      webhookId: "a8ffb4a0-1b93-4f05-8137-a924dafd6806",
    },
    {
      parameters: {
        path: "3691d565-9dd0-4fcd-a1f4-2338f504679e",
        options: {},
      },
      type: "n8n-nodes-base.webhook",
      typeVersion: 2.1,
      position: [1424, 880],
      id: "a8d237eb-41e0-4753-bbf8-b9c030fefe35",
      name: "Webhook1",
      webhookId: "3691d565-9dd0-4fcd-a1f4-2338f504679e",
    },
    {
      parameters: {
        operation: "create",
        base: {
          __rl: true,
          mode: "list",
          value: "",
        },
        table: {
          __rl: true,
          mode: "list",
          value: "",
        },
        columns: {
          mappingMode: "defineBelow",
          value: {},
          matchingColumns: [],
          schema: [],
          attemptToConvertTypes: false,
          convertFieldsToString: false,
        },
        options: {},
      },
      type: "n8n-nodes-base.airtable",
      typeVersion: 2.1,
      position: [2800, 624],
      id: "ec470352-ebe7-44c7-8ffd-9f055354a83d",
      name: "Create a record",
      credentials: {
        airtableTokenApi: {
          id: "chXYlHsOAvwwhhpH",
          name: "Airtable Personal Access Token account",
        },
      },
    },
    {
      parameters: {
        resource: "lead",
        operation: "get",
        leadId: "123",
      },
      type: "n8n-nodes-base.pipedrive",
      typeVersion: 1,
      position: [3008, 624],
      id: "f406b876-1844-433a-a816-7dd556e8a01b",
      name: "Get a lead",
    },
    {
      parameters: {
        title: "test",
        additionalFields: {},
      },
      type: "n8n-nodes-base.pipedrive",
      typeVersion: 1,
      position: [3216, 624],
      id: "fd023fb1-7a26-46f9-b6fa-222039533e38",
      name: "Create a deal",
    },
    {
      parameters: {
        operation: "delete",
        contactId: {
          __rl: true,
          mode: "list",
          value: "",
        },
      },
      type: "n8n-nodes-base.hubspot",
      typeVersion: 2.2,
      position: [3424, 624],
      id: "43838854-6613-4ac7-a99c-7013c1db3ba7",
      name: "Delete a contact",
    },
    {
      parameters: {
        resource: "case",
        additionalFields: {},
      },
      type: "n8n-nodes-base.salesforce",
      typeVersion: 1,
      position: [3632, 624],
      id: "319ceaea-bf6b-4f07-9d5b-5f36aaee7f9f",
      name: "Create a case",
    },
  ],
  pinData: {},
  connections: {
    "Filter Status (Waiting for sending)": {
      main: [
        [
          {
            node: "Merge fields",
            type: "main",
            index: 1,
          },
          {
            node: "Send a message (Gmail)",
            type: "main",
            index: 0,
          },
        ],
      ],
    },
    "Set data": {
      main: [
        [
          {
            node: "Update Message Status",
            type: "main",
            index: 0,
          },
        ],
      ],
    },
    "Schedule Trigger": {
      main: [
        [
          {
            node: "Retrieve Customer Messages Data",
            type: "main",
            index: 0,
          },
        ],
      ],
    },
    "Retrieve Customer Messages Data": {
      main: [
        [
          {
            node: "Filter Status (Waiting for sending)",
            type: "main",
            index: 0,
          },
        ],
      ],
    },
    "Send a message (Gmail)": {
      main: [
        [
          {
            node: "Merge fields",
            type: "main",
            index: 0,
          },
        ],
      ],
    },
    "Merge fields": {
      main: [
        [
          {
            node: "Set data",
            type: "main",
            index: 0,
          },
        ],
      ],
    },
    Webhook: {
      main: [
        [
          {
            node: "Send a message (Gmail)",
            type: "main",
            index: 0,
          },
        ],
      ],
    },
    "Update Message Status": {
      main: [
        [
          {
            node: "Create a record",
            type: "main",
            index: 0,
          },
        ],
      ],
    },
    "Create a record": {
      main: [
        [
          {
            node: "Get a lead",
            type: "main",
            index: 0,
          },
        ],
      ],
    },
    "Get a lead": {
      main: [
        [
          {
            node: "Create a deal",
            type: "main",
            index: 0,
          },
        ],
      ],
    },
    "Create a deal": {
      main: [
        [
          {
            node: "Delete a contact",
            type: "main",
            index: 0,
          },
        ],
      ],
    },
    "Delete a contact": {
      main: [
        [
          {
            node: "Create a case",
            type: "main",
            index: 0,
          },
        ],
      ],
    },
  },
  active: false,
  settings: {
    executionOrder: "v1",
  },
  versionId: "",
  meta: {
    instanceId:
      "af4d1172013c8968d0fd0e8565c06ecff0b504bb11ecd27f52e701335f189fcd",
  },
  tags: [],
};

export default n8n_json;
