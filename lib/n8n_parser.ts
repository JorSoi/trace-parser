const nodeList: ParsedNode[] = [];
const edges: Edge[] = [];

// Entry point for parsing N8N. Handles
export function parseN8n(workflow: Workflow): void {
  parseNodes(workflow);
  parseEdges(workflow);

  console.log(nodeList);
  printGraphAscii(edges, nodeList);
  //   console.log(edges)
}

const parseNodes = (workflow: Workflow): void => {
  workflow.nodes.forEach((node: Node) => {
    //Omit stickyNote nodes
    if (getService(node) === "stickyNote") return;

    nodeList.push({
      isTrigger: getTrigger(node), // ✅
      action: getAction(node), // 🟡
      operation_name: node.name, // ✅
      service: getService(node), // 🟡
      type: getType(node),
      raw_json: JSON.parse(JSON.stringify(node)), // ✅
    });
  });
};

// All trigger nodes contain the word "Trigger" at the end of the node's 'type' value. Webhooks are the exception.
const getTrigger = (node: Node): boolean => {
  const typeReference = node.type.toLowerCase().split(".")[1];

  return typeReference.endsWith("trigger") || typeReference === "webhook";
};

const getAction = (node: Node): NodeAction => {
  const op =
    node.parameters.operation?.toLowerCase() ?? node.name.toLowerCase();

  //Treating triggers as read)
  if (getTrigger(node)) return "read";

  // ------- UPDATE -------
  if (op.startsWith("update") || op.includes("update") || op.includes("set")) {
    return "update";
  }

  // ------- CREATE / WRITE -------
  if (
    op.startsWith("add") ||
    op.startsWith("create") ||
    op.startsWith("generate") ||
    op.startsWith("insert") ||
    op.startsWith("run") ||
    op.startsWith("upload") ||
    op.includes("make") ||
    op.includes("send") ||
    op.includes("add") ||
    op.includes("create") ||
    op.includes("append") ||
    op.includes("generate")
  ) {
    return "write";
  }

  // ------- DELETE -------
  if (
    op.startsWith("delete") ||
    op.startsWith("remove") ||
    op.includes("delete") ||
    op.includes("remove")
  ) {
    return "delete";
  }

  // ------- READ -------
  if (
    op.startsWith("get") ||
    op.includes("getall") ||
    op.startsWith("read") ||
    op.startsWith("evaluate") ||
    op.startsWith("watch") ||
    op.startsWith("retrieve") ||
    op.startsWith("list") ||
    op.startsWith("filter") ||
    op.startsWith("download") ||
    op.startsWith("translate") ||
    op.startsWith("search")
  ) {
    return "read";
  }

  // ------- DEFAULT -------
  return null;
};

const getService = (node: Node): string => {
  return node.type.split(".")[1];
};

const getType = (node: Node): "tool" | "router" | "app" => {
  const BUILTIN_TOOLS = new Set([
    // CORE TRIGGERS
    "webhook",
    "cron",
    "interval",
    "errorTrigger",
    "executeWorkflowTrigger",
    "manualTrigger",
    "scheduleTrigger",

    // AI & LANGCHAIN CORE
    "agent",
    "outputParserStructured",
    "chain",
    "tool",
    "memory",
    "outputParser",
    "vectorStore",
    "retriever",
    "textSplitter",

    // Core Transformation
    "set",
    "code",
    "function",
    "functionItem",
    "merge",
    "compareDatasets",
    "dateTime",
    "noOp",
    "wait",
    "executeWorkflow",

    // Lists & Arrays
    "splitInBatches",
    "aggregate",
    "limit",
    "sort",
    "filter",
    "removeDuplicates",
    "splitOut",
    "summarize",
    "itemLists",

    // Content & Formats
    "markdown",
    "html",
    "xml",
    "crypto",
    "renameKeys",
    "convertToFile",
    "compression",
    "spreadsheetFile",

    // Generic Network (Often considered builtin as it has no specific service logo)
    "httpRequest",
    "ftp",
    "ssh",
  ]);

  const service = getService(node);

  // ------- ROUTER -------
  if (service == "if" || service == "switch") {
    return "router";
  }
  // ------- TOOL -------
  if (BUILTIN_TOOLS.has(service)) {
    return "tool";
  }

  // ------- DEFAULT -------
  return "app";
};

// Parse Edges. N8N workflows are not linear and nodes can have a many to many relationship. N8N uses node names as their unique identifier so we need to go through each node and see which other nodes are given as destination-nodes.
export const parseEdges = ({ connections }: Workflow): void => {
  if (!connections) return;

  // 1. Loop through every node
  for (const [sourceNode, connection] of Object.entries(connections)) {
    // 2. Loop through connection types (e.g., "main", "ai_tool") dynamically
    for (const [connectionType, nextNodes] of Object.entries(connection)) {
      // 3. Your logic: Flatten the nested arrays to get a simple list of targets
      (nextNodes as any)
        .flatMap((t: any) => t)
        .forEach((target: any) => {
          edges.push({
            fromNodeId: sourceNode,
            toNodeId: target.node,
          });
        });
    }
  }
};

// Visualizer for Debugging
function printGraphAscii(edges: Edge[], nodes: ParsedNode[]): void {
  // 1. Node lookup
  const nodeMap = new Map<string, ParsedNode>();
  nodes.forEach((node) => nodeMap.set(node.operation_name, node));

  // 2. Adjacency + incoming edges
  const adjacencyList = new Map<string, string[]>();
  const incomingEdgeCount = new Map<string, number>();
  const allNodeIds = new Set<string>();

  edges.forEach(({ fromNodeId, toNodeId }) => {
    if (!adjacencyList.has(fromNodeId)) adjacencyList.set(fromNodeId, []);
    adjacencyList.get(fromNodeId)!.push(toNodeId);

    incomingEdgeCount.set(toNodeId, (incomingEdgeCount.get(toNodeId) || 0) + 1);

    allNodeIds.add(fromNodeId);
    allNodeIds.add(toNodeId);
  });

  // 3. Roots (independent flows)
  const roots = Array.from(allNodeIds).filter(
    (id) => !incomingEdgeCount.has(id),
  );

  if (roots.length === 0 && allNodeIds.size > 0) {
    roots.push(Array.from(allNodeIds)[0]);
  }

  const globallyRendered = new Set<string>();

  console.log("\n📦 Workflow (N8N)");
  console.log("===================================");

  const printNode = (
    nodeId: string,
    prefix: string,
    isLast: boolean,
    pathVisited: Set<string>,
  ) => {
    const node = nodeMap.get(nodeId);
    const connector = isLast ? "└── " : "├── ";

    let displayName = `Unknown Node (${nodeId})`;
    if (node) {
      displayName = `${node.action ?? "null"} | ${node.operation_name} (${node.service} - ${node.type})`;
    }

    // Shared node reference
    if (globallyRendered.has(nodeId)) {
      console.log(`${prefix}${connector}${displayName}`);
      return;
    }

    console.log(`${prefix}${connector}${displayName}`);

    // Cycle detection
    if (pathVisited.has(nodeId)) return;

    globallyRendered.add(nodeId);
    pathVisited.add(nodeId);

    const children = adjacencyList.get(nodeId) || [];
    const childPrefix = prefix + (isLast ? "    " : "│   ");

    children.forEach((childId, index) => {
      printNode(
        childId,
        childPrefix,
        index === children.length - 1,
        new Set(pathVisited),
      );
    });
  };

  // 4. Render flows with clear separation
  roots.forEach((root, index) => {
    if (index > 0) {
      console.log("");
      console.log(""); // space between flows
    }
    printNode(root, "", true, new Set());
  });

  console.log("===================================\n");
}
