const nodeList: ParsedNode[] = [];
const edges: Edge[] = [];

export default function parseMake(blueprint: Blueprint): void {
  if (!blueprint.flow) return;

  parseFlow(blueprint.flow);
  printGraphAscii(edges, nodeList);
}

function parseFlow(
  flow: Module[],
  isFirstNode = true,
  routerNodeId?: string, // Used to pass prevNodeId from prior flow into current subflow.
): void {
  let prevNodeId = routerNodeId;

  flow.forEach((node: any, idx: number) => {
    const first = isFirstNode && idx === 0;

    // Pass the current tracker
    parseNode(node, first, prevNodeId);

    //Update to current node id
    prevNodeId = node.id;

    if (first) isFirstNode = false;
  });
}

function parseNode(node: any, isTrigger: boolean, prevNodeId?: string): void {
  const parsedNode = {
    isTrigger: prevNodeId == null,
    action: getNodeAction(node),
    operation_name: getOperationName(node),
    service: getService(node),
    type: getType(node),
    raw_json: JSON.parse(JSON.stringify(node)),
  };

  nodeList.push(parsedNode);

  if (prevNodeId) {
    edges.push({ fromNodeId: prevNodeId, toNodeId: node.id });
  }

  // If this node is a router, recursively parse each branch
  if (parsedNode.type === "router") {
    const routes = parsedNode.raw_json.routes || [];
    routes.forEach((route: any) => {
      parseFlow(route.flow, false, node.id); // nested flows are never the first node
    });
  }
}

const getNodeAction = (
  node: any,
): "read" | "write" | "update" | "delete" | null => {
  const op = node.module.split(":")[1].toLowerCase();

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
    op.includes("make") ||
    op.includes("send") ||
    op.includes("add") ||
    op.includes("create")
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

  // ------- TRIGGERS (treated as READ) -------
  if (op.includes("trigger") || op.includes("watch")) {
    return "read";
  }

  // ------- DEFAULT -------
  return null;
};

const getService = (node: any): String => {
  return node.module.split(":")[0].toLowerCase();
};

const getOperationName = (node: any): string => {
  const op = node.module.split(":")[1];

  return op
    .split(/(?=[A-Z])/)
    .filter((word: String) => {
      const w = word.toLowerCase();
      return !w.includes("trigger") && !w.startsWith("action");
    })
    .map((word: String) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const BUILTIN_TOOLS = new Set([
  "archive",
  "barcodes",
  "builtin",
  "csv",
  "currency",
  "datastore",
  "email",
  "encryptor",
  "flowcontrol",
  "ftp",
  "gps-tools",
  "http",
  "httpagent",
  "image",
  "iso",
  "json",
  "markdown",
  "math",
  "mime",
  "phonenumber",
  "placeholder",
  "regexp",
  "rss",
  "sapeccagent",
  "scenarios",
  "sftp",
  "soap",
  "ssh",
  "textparser",
  "tools",
  "units",
  "util",
  "weather",
  "gateway",
  "xlsx",
  "xml",
  "xmp",
]);

const getType = (node: any): "tool" | "router" | "app" => {
  const [rawType, rawOp] = node.module.split(":");

  if (rawOp === "BasicRouter") {
      return "router";
    } else if (BUILTIN_TOOLS.has(rawType)) {
      return "tool";
  } else {
    return "app";
  }
};

// Visualizer for Debugging
function printGraphAscii(edges: Edge[], nodes: ParsedNode[]): void {
  // 1. Create Lookup Map
  const nodeMap = new Map<string, ParsedNode>();

  nodes.forEach((node) => {
    // Cast raw_json to any to safely access id without needing the Module interface
    const raw = node.raw_json as any;

    // Ensure the key is stored as a String
    if (raw && raw.id) {
      nodeMap.set(String(raw.id), node);
    }
  });

  // 2. Build Adjacency List
  const adjacencyList = new Map<string, string[]>();
  const children = new Set<string>();
  const allNodes = new Set<string>();

  edges.forEach(({ fromNodeId, toNodeId }) => {
    // FIX: Explicitly convert edge IDs to strings so they match the nodeMap keys
    const u = String(fromNodeId);
    const v = String(toNodeId);

    if (!adjacencyList.has(u)) adjacencyList.set(u, []);
    adjacencyList.get(u)?.push(v);

    children.add(v);
    allNodes.add(u);
    allNodes.add(v);
  });

  // 3. Identify Roots
  const roots = Array.from(allNodes).filter((node) => !children.has(node));

  console.log("\n📦 Flow Visualization:");
  console.log("===================================");

  if (roots.length === 0 && edges.length > 0) {
    console.log("⚠️  Warning: Cyclic graph detected (no clear root).");
    return;
  }

  // 4. Recursive Print
  const printNode = (nodeId: string, prefix: string, isLast: boolean) => {
    // Lookup using the string ID
    const node = nodeMap.get(nodeId);

    const serviceName = node
      ? `${node.action} | ${node.operation_name} (${node.service} - ${node.type})`
      : "Unknown";

    // If node is found, print Service + ID, otherwise Unknown
    const displayName = node
      ? `\x1b[1m${serviceName}\x1b[0m`
      : `Unknown Node (${nodeId})`;

    const connector = isLast ? "└── " : "├── ";
    console.log(`${prefix}${connector}${displayName}`);

    const kids = adjacencyList.get(nodeId) || [];
    const childPrefix = prefix + (isLast ? "    " : "│   ");

    kids.forEach((childId, index) => {
      printNode(childId, childPrefix, index === kids.length - 1);
    });
  };

  // 5. Render
  roots.forEach((root) => {
    printNode(root, "", true);
  });
  console.log("===================================\n");
}
