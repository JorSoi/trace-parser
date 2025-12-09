const nodeList: ParsedNode[] = [];
const edges: Edge[] = [];

export default function parseN8n(workflow: Workflow): void {
  workflow.nodes.forEach((node: Node) => {
    parseNode(node);
  });
  
  console.log(nodeList);
  console.log("==================================================")
}

const parseNode = (node: Node): void => {
  const parsedNode: ParsedNode = {
    isTrigger: getTrigger(node),
    action: getAction(node),
    operation_name: node.name,
    service: node.type.split(".")[1],
    type: "tool",
    raw_json: JSON.parse(JSON.stringify(node)),
  };

  nodeList.push(parsedNode);
};

const getTrigger = (node: Node): boolean => {
  const typeReference = node.type.toLowerCase().split(".")[1];

  return typeReference.includes("trigger") || typeReference.includes("webhook");
};

const getAction = (node: Node): NodeAction => {
  const op = node.parameters.operation;

  if (!op) return null;

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
    op.includes("create") ||
    op.includes("append")
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

  // ------- DEFAULT -------
  return null;
};
