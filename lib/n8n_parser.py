import json
import re
from typing import List, Dict, Any, Optional
from pathlib import Path

def parse_n8n(n8n_data: Dict[str, Any], workflow_name: str = "Untitled Workflow") -> Dict[str, Any]:
    """
    Parses n8n JSON data and returns workflow information in a standardized format.
    
    Args:
        n8n_data: The raw n8n JSON export dictionary.
        workflow_name: Fallback name if no title is found in the JSON.
    
    Returns:
        A dictionary containing lists of nodes, edges, and workflow metadata.
    """
    all_nodes = []
    all_edges = []
    
    # n8n workflows usually have an ID, otherwise we use a placeholder
    workflow_id = n8n_data.get("id", "local-id")
    nodes_list = n8n_data.get("nodes", [])
    connections = n8n_data.get("connections", {})

    # Helper: Identifies trigger nodes based on naming conventions and core types
    def is_n8n_trigger(node_type: str) -> bool:
        t = node_type.lower()
        # n8n trigger patterns based on official naming conventions
        trigger_patterns = [
            "trigger",      # Standard app-specific triggers (e.g., googleSheetsTrigger)
            "webhook",       # Webhook listener
            "poll",          # Polling-based nodes
            "cron",          # Schedule trigger (older versions)
            "schedule",      # Modern schedule trigger
            "interval",      # Time interval trigger
            "start",         # Legacy start node (pre v1.0)
            "manual"         # Manual execution trigger
        ]
        return any(pattern in t for pattern in trigger_patterns)

    # Helper: Maps n8n 'operation' parameters to generic action categories
    def get_n8n_action(node: Dict[str, Any]) -> str:
        node_type = node.get("type", "").lower()
        params = node.get("parameters", {})

        # n8n uses 'operation' for most nodes, but sometimes 'mode' or 'promptType' for AI nodes
        op = params.get("operation", params.get("mode", params.get("promptType", node_type.split(".")[1]))).lower()
        
        if any(x in op for x in ["get", "getall", "read", "evaluate", "watch", "retrieve", "list", "filter", "download", "translate", "search", "fetch", "wait"]) or is_n8n_trigger(node.get("type", "")):
            return "read"
        if any(x in op for x in ["add", "create", "generate", "insert", "run", "upload", "make", "send", "append"]):
            return "write"
        if any(x in op for x in ["update", "set", "define", "code"]): # 'code' often modifies data but this is a best-effort guess
            return "update"
        if any(x in op for x in ["delete", "remove"]):
            return "delete"
        
        #Special Case: HTTP Request Node
        # Here the 'method' determines the action
        if "httprequest" in node_type:
            method = params.get("method", "GET").upper() # fallback to GET because normally if paramter method is missing its a request to URL do download data
            mapping = {
                "GET": "read",
                "POST": "write",
                "PUT": "update",
                "PATCH": "update",
                "DELETE": "delete"
            }
            return mapping.get(method, "")
        
        return "" # Default fallback 
    
    # Helper: Determines the type of n8n node (trigger, action, etc.)
    def get_n8n_type(node_type: str) -> str:
        t = node_type.lower()
        BUILTIN_TOOLS = [
            #CORE TRIGGERS
            "webhook",
            "cron",
            "interval",
            "errorTrigger",
            "executeWorkflowTrigger",
            "manualTrigger",
            "scheduleTrigger",

            #AI & LANGCHAIN CORE
            "agent",
            "outputParserStructured",
            "chain",
            "tool",
            "memory",
            "outputParser",
            "vectorStore",
            "retriever",
            "textSplitter",

            #Core Transformation
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

            # Lists & Arrays
            "splitInBatches",
            "aggregate",
            "limit",
            "sort",
            "filter",
            "removeDuplicates",
            "splitOut",
            "summarize",
            "itemLists",

            # Content & Formats
            "markdown",
            "html",
            "xml",
            "crypto",
            "renameKeys",
            "convertToFile",
            "compression",
            "spreadsheetFile",

            #Generic Network (Often considered builtin as it has no specific service logo)
            "httpRequest",
            "ftp",
            "ssh"
        ]

    
        if any(bt in t for bt in BUILTIN_TOOLS):
            return "tool"
        if any(x in t for x in ["if","switch"]):
            return "router"
        
        return "app" # for everything else (app nodes)

    #Parse nodes
    for node in nodes_list:
        node_name = node.get("name")
        node_type_raw = node.get("type", "")
        
        # Omit stickyNotes 
        if node_type_raw == "n8n-nodes-base.stickyNote":
            continue

        # Construct the standardized node object
        parsed_node = {
            "id": node_name,  # n8n uses the 'name' as a unique identifier for connections
            "workflow_id": workflow_id,
            "is_trigger": is_n8n_trigger(node_type_raw),
            "action": get_n8n_action(node),
            "operation_name": node_name,
            "service": node_type_raw.split('.')[-1] if '.' in node_type_raw else node_type_raw, # Extract the service name from the technical type
            "type": get_n8n_type(node_type_raw),
            "raw_json": node
        }
        all_nodes.append(parsed_node)

    #Parse edges (Connections)
    # n8n structure: SourceNode -> ConnectionType (main/error) -> OutputIndex -> TargetNode
    for from_node_name, connection_data in connections.items():
        # Iterate through all connection types (usually only 'main')
        for connection_type in connection_data.values():
            for output_index_group in connection_type:
                for connection in output_index_group:
                    all_edges.append({
                        "from_node_id": from_node_name,
                        "to_node_id": connection.get("node"),
                        "workflow_id": workflow_id
                    })

    #Consolidate workflow info (metadata)
    workflow_info = [{
        "id": workflow_id,
        "title": n8n_data.get("name", workflow_name),
        "status": "active" if n8n_data.get("active") else "inactive",
        "node_count": len(all_nodes)
    }]

    return {
        "nodes": all_nodes,
        "edges": all_edges,
        "workflow": workflow_info 
    }    


def print_workflow_graph(parsed_data: Dict[str, Any]) -> None:
    """
    Visualizes the parsed workflow data as an ASCII tree, 
    handling cycles to prevent RecursionError.
    """
    nodes = parsed_data["nodes"]
    edges = parsed_data["edges"]
    workflows = parsed_data["workflow"]
    
    for wf in workflows:
        wf_id = wf["id"]
        print(f"\n Workflow: {wf['title']} (Status: {wf['status']})")
        print("=" * 75)
        
        wf_nodes = {n["id"]: n for n in nodes if n["workflow_id"] == wf_id}
        wf_edges = [e for e in edges if e["workflow_id"] == wf_id]
        
        adjacency = {}
        children_ids = set()
        
        for edge in wf_edges:
            f_id = edge["from_node_id"]
            t_id = edge["to_node_id"]
            if f_id not in adjacency:
                adjacency[f_id] = []
            adjacency[f_id].append(t_id)
            children_ids.add(t_id)
        
        roots = [nid for nid in wf_nodes.keys() if nid not in children_ids]
        
        # We use a set to keep track of nodes already visited in the CURRENT path
        def draw_node(node_id: str, prefix: str = "", is_last: bool = True, visited: set = None):
            if visited is None:
                visited = set()
            
            node = wf_nodes.get(node_id)
            if not node:
                return

            # Check for cycles
            is_loop = node_id in visited
            
            # Format string
            trigger_mark = "⚡ " if node['is_trigger'] else ""
            loop_mark = " 🔄 [LOOP/CYCLE]" if is_loop else ""
            node_desc = f"{node['action'].upper()} | {node['operation_name']} ({node['service']})"
            display = f"{trigger_mark}\033[1m{node_desc}\033[0m{loop_mark}"
            
            connector = "└── " if is_last else "├── "
            print(f"{prefix}{connector}{display}")
            
            # If it's a loop, we stop diving deeper into this branch
            if is_loop:
                return

            # Add current node to visited set for children
            new_visited = visited | {node_id} # Create a new set for the next level
            
            kids = adjacency.get(node_id, [])
            new_prefix = prefix + ("    " if is_last else "│   ")
            
            for idx, child_id in enumerate(kids):
                draw_node(child_id, new_prefix, idx == len(kids) - 1, new_visited)
        
        if not roots and wf_nodes:
            # If there's a circular workflow with no clear root, start with the first node
            first_id = list(wf_nodes.keys())[0]
            draw_node(first_id)
        else:
            for root in roots:
                draw_node(root)
        
        print("=" * 75)

# Example usage
if __name__ == "__main__":
    path = Path("data/n8n.json")
    if not path.exists():
        raise FileNotFoundError(path)

    with path.open() as f:
       n8n_json = json.load(f)

    result = parse_n8n(n8n_json)
    print(json.dumps(result.get("nodes"), indent=2))
    print_workflow_graph(result)
    pass