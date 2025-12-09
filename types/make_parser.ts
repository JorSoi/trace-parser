// A single node in the Make scenario flow
type Module = {
  id?: number;
  module?: string; // e.g., "google-sheets:watchRows", "json:ParseJSON"
  version?: number;
  mapper?: Record<string, any>;
  onerror?: Array<Record<string, any>>;
  parameters?: Array<Record<string, any>>;
  metadata?: {
    designer?: Record<string, any>;
    restore?: Record<string, any>;
    expect?: Array<Record<string, any>>;
  };
};

// The blueprint of the scenario
type Blueprint = {
  name?: string;
  flow?: Module[];
  metadata?: {
    version?: number;
    scenario?: {
      roundtrips?: number;
      maxErrors?: number;
      autoCommit?: boolean;
      autoCommitTriggerLast?: boolean;
      sequential?: boolean;
      confidential?: boolean;
      dataloss?: boolean;
      dlq?: boolean;
      freshVariables?: boolean;
    };
    designer?: {
      orphans?: any[];
    };
    notes?: any[];
    zone?: string;
  };
};

type NodeAction = "read" | "write" | "update" | "delete" | null;
type NodeType = "tool" | "router" | "app";

interface ParsedNode {
  isTrigger: boolean;
  action: NodeAction;
  operation_name: string; // the operation name eg. 'Set Variable', 'Add Row', etc.
  service: String; //the service name eg. 'hubspot', 'google-sheets', etc.
  type: NodeType;
  raw_json: unknown; //raw json of the node
}

interface Edge {
  fromNodeId: string;
  toNodeId: string;
  // Optional: You might need these later for Make.com filters
  // type?: "standard" | "error_handler";
  // filter?: any;
}
