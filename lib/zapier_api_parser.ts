import * as fs from "fs";
import * as path from "path";

type AnyObject = { [key: string]: any };

function getActionType(node: AnyObject): string {
    // Extracts the type of the action 
    const action = node?.action ?? {};

    if (action) {
        // First check the explicit action_type field and normalize known values
        let typeOf: string = action.action_type ?? "";
        if (typeOf) {
            typeOf = typeOf.toLowerCase();
            const mapping: Record<string, string> = {
                read: "read",
                read_bulk: "read",
                search: "read",
                search_or_write: "write",
                search_and_write: "write",
                write: "write",
                update: "update",
                delete: "delete",
                filter: "read"
            };
            // If the type is unknown return an empty string
            return mapping[typeOf] ?? "";
        }
    }
    return "";
}

function getServiceName(node: AnyObject): string {
    // Returns the application name 
    const action = node?.action;
    if (action && action.app) {
        return action.app.title ?? "";
    }
    return "";
}

function getOperationName(node: AnyObject): string {
    // Returns the name of the operation
    return node.title ?? node?.action?.title ?? "";
}

function parseZapierApiV2(apiData: AnyObject) {
    const allNodes: AnyObject[] = [];
    const allEdges: AnyObject[] = [];
    const zapInfos: AnyObject[] = [];

    if (!apiData.data) {
        return { nodes: [], edges: [], zaps: [] };
    }

    for (const zap of apiData.data) {
        const zapId = zap.id;
        const zapTitle = zap.title ?? "";
        const steps = zap.steps ?? [];

        let prevNodeId: string | null = null;

        steps.forEach((step: AnyObject, idx: number) => {
            // Generate a unique id for each node in the wf
            const currentNodeId = `${zapId}_step_${idx}`;

            const serviceName = getServiceName(step);

            const node = {
                id: currentNodeId,
                zap_id: zapId,
                is_trigger: idx === 0,
                operation: getActionType(step),
                operation_name: getOperationName(step),
                // No object or resource available in the Zapier API
                service: serviceName,
                type: serviceName.toLowerCase().includes("sub-zap")
                    ? "tool"
                    : serviceName.toLowerCase().includes("filter")
                    ? "router"
                    : "tool",
                raw_json: step
            };

            allNodes.push(node);

            // Create an edge to the previous node forming a linear chain
            if (prevNodeId) {
                allEdges.push({
                    from_node_id: prevNodeId,
                    to_node_id: currentNodeId,
                    zap_id: zapId
                });
            }

            prevNodeId = currentNodeId;
        });

        zapInfos.push({
            id: zapId,
            title: zapTitle,
            platform: "zapier",
            status: zap.is_enabled ? "active" : "paused",
            updated_at: zap.updated_at,
            node_count: steps.length
        });
    }

    return { nodes: allNodes, edges: allEdges, zaps: zapInfos };
}

function printVisualGraph(parsedData: AnyObject) {
    if (!parsedData) return;

    for (const zap of parsedData.zaps) {
        console.log(`\n⚡ Zap: ${zap.title} (${zap.status})`);
        console.log("=".repeat(65));

        const zapId = zap.id;
        const nodes: Record<string, AnyObject> = {};
        parsedData.nodes
            .filter((n: AnyObject) => n.zap_id === zapId)
            .forEach((n: AnyObject) => {
                nodes[n.id] = n;
            });

        const edges = parsedData.edges.filter(
            (e: AnyObject) => e.zap_id === zapId
        );

        // Build adjacency list
        const adj: Record<string, string[]> = {};
        const children = new Set<string>();
        
        for (const e of edges) {
            const from = e.from_node_id;
            if (!adj[from]) {
                adj[from] = [];
            }
            adj[from]!.push(e.to_node_id);
            children.add(e.to_node_id);
}

        const roots = Object.keys(nodes).filter(
            nid => !children.has(nid)
        );

        function draw(
            nodeId: string,
            prefix: string = "",
            isLast: boolean = true
        ) {
            const node = nodes[nodeId];
            if (!node) return;

            const connector = isLast ? "└── " : "├── ";
            const label = `${node.operation} | ${node.operation_name} (${node.service})`;

            // Bold output in terminal
            console.log(`${prefix}${connector}\x1b[1m${label}\x1b[0m`);

            const kids = adj[nodeId] ?? [];
            const newPrefix = prefix + (isLast ? "    " : "│   ");

            kids.forEach((kid, index) => {
                draw(kid, newPrefix, index === kids.length - 1);
            });
        }

        roots.forEach(root => draw(root));
        console.log("=".repeat(65));
    }
}

// Test execution
const filePath = path.join("data", "zapier_api.json");
if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
}

const raw = fs.readFileSync(filePath, "utf8");
const zapierJson = JSON.parse(raw);

const result = parseZapierApiV2(zapierJson);
console.log(JSON.stringify(result, null, 2));
printVisualGraph(result);
