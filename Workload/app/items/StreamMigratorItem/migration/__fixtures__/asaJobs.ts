/**
 * Captured-shape Stream Analytics jobs used to exercise the mapping engine.
 *
 * These follow the response shape of
 * GET .../streamingjobs/{job}?$expand=inputs,outputs,transformation,functions
 * documented at https://learn.microsoft.com/en-us/rest/api/streamanalytics/streaming-jobs/get
 */

import { AsaStreamingJob } from "../../../../clients/AzureResourceManagerTypes";

function job(name: string, properties: AsaStreamingJob["properties"]): AsaStreamingJob {
  return {
    id: `/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg1/providers/Microsoft.StreamAnalytics/streamingjobs/${name}`,
    name,
    type: "Microsoft.StreamAnalytics/streamingjobs",
    location: "West US",
    properties
  };
}

/** The happy path: Event Hub in, Azure Data Explorer out, simple query. */
export const eventHubToKustoJob = job("telemetry-job", {
  compatibilityLevel: "1.2",
  eventsOutOfOrderPolicy: "Adjust",
  eventsOutOfOrderMaxDelayInSeconds: 5,
  eventsLateArrivalMaxDelayInSeconds: 300,
  inputs: [
    {
      name: "deviceInput",
      properties: {
        type: "Stream",
        datasource: {
          type: "Microsoft.ServiceBus/EventHub",
          properties: {
            serviceBusNamespace: "contoso-ns",
            eventHubName: "telemetry",
            consumerGroupName: "$Default"
          }
        },
        serialization: { type: "Json", properties: { encoding: "UTF8" } }
      }
    }
  ],
  transformation: {
    name: "Transformation",
    properties: {
      streamingUnits: 3,
      query: "SELECT deviceId, temperature INTO [kustoOutput] FROM [deviceInput] WHERE temperature > 20"
    }
  },
  outputs: [
    {
      name: "kustoOutput",
      properties: {
        datasource: {
          type: "Microsoft.Kusto/clusters/databases",
          properties: { database: "telemetryDb", table: "Readings" }
        }
      }
    }
  ],
  functions: []
});

/** Blob stream input and a SQL sink: both unsupported. */
export const blobToSqlJob = job("archive-job", {
  eventsOutOfOrderPolicy: "Drop",
  inputs: [
    {
      name: "blobInput",
      properties: {
        type: "Stream",
        datasource: {
          type: "Microsoft.Storage/Blob",
          properties: { container: "raw", pathPattern: "{date}/{time}" }
        },
        serialization: { type: "Csv", properties: { encoding: "UTF8", fieldDelimiter: "," } }
      }
    }
  ],
  transformation: {
    name: "Transformation",
    properties: { query: "SELECT * INTO [sqlOutput] FROM [blobInput]" }
  },
  outputs: [
    {
      name: "sqlOutput",
      properties: {
        datasource: {
          type: "Microsoft.Sql/Server/Database",
          properties: { server: "srv", database: "db", table: "tbl" }
        }
      }
    }
  ],
  functions: []
});

/** Reference-data join plus a UDF: two independent blockers. */
export const referenceAndUdfJob = job("enrich-job", {
  eventsOutOfOrderPolicy: "Adjust",
  eventsOutOfOrderMaxDelayInSeconds: 10,
  eventsLateArrivalMaxDelayInSeconds: 60,
  inputs: [
    {
      name: "eventInput",
      properties: {
        type: "Stream",
        datasource: {
          type: "Microsoft.EventHub/EventHub",
          properties: { eventHubName: "events", consumerGroupName: "cg1" }
        },
        serialization: { type: "Json", properties: { encoding: "UTF8" } }
      }
    },
    {
      name: "lookupInput",
      properties: {
        type: "Reference",
        datasource: {
          type: "Microsoft.Storage/Blob",
          properties: { container: "ref", pathPattern: "lookup.json" }
        },
        serialization: { type: "Json", properties: { encoding: "UTF8" } }
      }
    }
  ],
  transformation: {
    name: "Transformation",
    properties: {
      query:
        "-- enrich events with lookup data\n" +
        "SELECT e.deviceId, udf.normalize(e.payload) AS payload INTO [lakeOutput] " +
        "FROM [eventInput] e JOIN [lookupInput] l ON e.deviceId = l.deviceId"
    }
  },
  outputs: [
    {
      name: "lakeOutput",
      properties: {
        datasource: {
          type: "Microsoft.DataLake/Accounts",
          properties: { accountName: "lake", filePathPrefix: "out/{date}" }
        }
      }
    }
  ],
  functions: [
    {
      name: "normalize",
      properties: { type: "Scalar", properties: { language: "JavaScript" } }
    }
  ]
});

/** A commented-out UDF reference must not trip the scanner. */
export const commentedUdfJob = job("comment-job", {
  eventsOutOfOrderPolicy: "Drop",
  inputs: [
    {
      name: "input1",
      properties: {
        type: "Stream",
        datasource: {
          type: "Microsoft.Devices/IotHubs",
          properties: { iotHubNamespace: "hub", consumerGroupName: "$Default" }
        },
        serialization: { type: "Json", properties: { encoding: "UTF8" } }
      }
    }
  ],
  transformation: {
    name: "Transformation",
    properties: {
      query: "-- previously used udf.cleanup here\nSELECT * INTO [ehOut] FROM [input1]"
    }
  },
  outputs: [
    {
      name: "ehOut",
      properties: {
        datasource: {
          type: "Microsoft.Storage/Blob",
          properties: { container: "out" }
        }
      }
    }
  ],
  functions: []
});

// ---- multiple inputs and outputs ------------------------------------------

function eventHubInput(name: string, eventHubName: string) {
  return {
    name,
    properties: {
      type: "Stream",
      datasource: {
        type: "Microsoft.ServiceBus/EventHub",
        properties: { serviceBusNamespace: "contoso-ns", eventHubName, consumerGroupName: "$Default" }
      },
      serialization: { type: "Json", properties: { encoding: "UTF8" } }
    }
  };
}

function kustoOutput(name: string, table: string) {
  return {
    name,
    properties: {
      datasource: {
        type: "Microsoft.Kusto/clusters/databases",
        properties: { database: "telemetryDb", table }
      }
    }
  };
}

function blobOutput(name: string) {
  return {
    name,
    properties: {
      datasource: { type: "Microsoft.Storage/Blob", properties: { container: name } }
    }
  };
}

/** Two regional Event Hubs merged by a UNION whose branches differ only in the input. */
export const unionTwoHubsJob = job("regions-job", {
  eventsOutOfOrderPolicy: "Adjust",
  inputs: [eventHubInput("eastHub", "east"), eventHubInput("westHub", "west")],
  transformation: {
    name: "Transformation",
    properties: {
      query:
        "-- merge both regions; FROM [eastHub] in a comment stays put\n" +
        "SELECT deviceId, temperature\n" +
        "INTO [allReadings]\n" +
        "FROM [eastHub] TIMESTAMP BY eventTime\n" +
        "UNION\n" +
        "SELECT deviceId, temperature\n" +
        "FROM [westHub] TIMESTAMP BY eventTime\n"
    }
  },
  outputs: [kustoOutput("allReadings", "Readings")],
  functions: []
});

/**
 * Two independent pipelines in one job: each input has its own step and
 * outputs, and both also write an audit row to a shared output.
 */
export const separatePipelinesJob = job("shop-job", {
  eventsOutOfOrderPolicy: "Adjust",
  inputs: [eventHubInput("orders", "orders"), eventHubInput("clicks", "clicks")],
  transformation: {
    name: "Transformation",
    properties: {
      query:
        "WITH cleanOrders AS (SELECT * FROM [orders] WHERE amount > 0),\n" +
        "recentClicks AS (SELECT * FROM [clicks] WHERE page IS NOT NULL)\n" +
        "SELECT * INTO [ordersOut] FROM cleanOrders\n" +
        "-- click stream\n" +
        "SELECT * INTO [clicksOut] FROM recentClicks\n" +
        "SELECT 'order' AS kind, id INTO [auditOut] FROM cleanOrders\n" +
        "SELECT 'click' AS kind, id INTO [auditOut] FROM recentClicks"
    }
  },
  outputs: [blobOutput("ordersOut"), kustoOutput("clicksOut", "Clicks"), kustoOutput("auditOut", "Audit")],
  functions: []
});

/** A stream-to-stream JOIN across two inputs (the toll booth example). */
export const streamJoinJob = job("toll-job", {
  eventsOutOfOrderPolicy: "Adjust",
  inputs: [eventHubInput("entries", "entry"), eventHubInput("exits", "exit")],
  transformation: {
    name: "Transformation",
    properties: {
      query:
        "SELECT e.TollId, DATEDIFF(minute, e.EntryTime, x.ExitTime) AS minutes\n" +
        "INTO [tripTimes]\n" +
        "FROM [entries] e TIMESTAMP BY EntryTime\n" +
        "JOIN [exits] x TIMESTAMP BY ExitTime\n" +
        "ON e.TollId = x.TollId AND DATEDIFF(minute, e, x) BETWEEN 0 AND 15"
    }
  },
  outputs: [kustoOutput("tripTimes", "Trips")],
  functions: []
});

/** One input fanned out to three outputs, one unsupported, plus an unused one. */
export const fanOutJob = job("fanout-job", {
  eventsOutOfOrderPolicy: "Adjust",
  inputs: [eventHubInput("telemetry", "telemetry")],
  transformation: {
    name: "Transformation",
    properties: {
      query:
        "SELECT * INTO [hot] FROM [telemetry]\n" +
        "SELECT * INTO [archive] FROM [telemetry]\n" +
        "SELECT deviceId INTO [alerts] FROM [telemetry] WHERE temperature > 90"
    }
  },
  outputs: [
    kustoOutput("hot", "Hot"),
    blobOutput("archive"),
    {
      name: "alerts",
      properties: { datasource: { type: "Microsoft.AzureFunction", properties: { functionName: "alert" } } }
    },
    {
      name: "debugOut",
      properties: {
        datasource: { type: "Microsoft.Sql/Server/Database", properties: { server: "s", database: "d", table: "t" } }
      }
    }
  ],
  functions: []
});

/** An input and an output that share a name. */
export const sameNameJob = job("events-job", {
  eventsOutOfOrderPolicy: "Adjust",
  inputs: [eventHubInput("events", "events")],
  transformation: {
    name: "Transformation",
    properties: { query: "SELECT * INTO events FROM events" }
  },
  outputs: [kustoOutput("events", "Events")],
  functions: []
});
