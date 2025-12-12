import json
from typing import List, Dict, Any, Optional, Set



def parse_zapier(zapier_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse Zapier JSON und gibt Workflow-Infos zurück.
    
    Args:
        zapier_data: Zapier JSON 
    
    Returns:
        Dictionary mit:
        - nodes: List der geparsten nodes
        - edges: List der edges, die die nodes verbinden
        - zaps: List der zap metadata
    """
    
    # Storage for results
    all_nodes = []
    all_edges = []
    zap_info = []
    
    if "zaps" not in zapier_data:
        return {"nodes": [], "edges": [], "zaps": []}
    
    # Helper: Get node action type
    def get_action(node: Dict[str, Any]) -> Optional[str]:
        type_of = node.get("type_of", "").lower()
        action = node.get("action", "").lower()
        
        if type_of == "read":
            return "read"
        elif type_of == "write":
            return "write"
        elif type_of == "update":
            return "update"
        elif type_of == "delete":
            return "delete"
        elif type_of == "filter":
            return "read"
        
        # Fallback to action analysis
        if "update" in action or "set" in action:
            return "update"
        if any(kw in action for kw in ["add", "create", "generate", "insert", "run", "make", "send"]):
            return "write"
        if "delete" in action or "remove" in action:
            return "delete"
        if any(kw in action for kw in ["get", "read", "evaluate", "watch", "retrieve", "list", "filter", "download", "search"]):
            return "read"
        if "trigger" in action or "hook" in action:
            return "read"
        
        return None
    
    # Helper: Get service name
    def get_service(node: Dict[str, Any]) -> str:
        selected_api = node.get("selected_api", "")
        service = selected_api.split("CLIAPI")[0] if "CLIAPI" in selected_api else selected_api
        service = service.split("@")[0]
        
        result = []
        for char in service:
            if char.isupper() and result:
                result.append(" ")
            result.append(char.lower())
        
        return "".join(result).strip() or "unknown"
    
    # Helper: Get operation name
    def get_operation_name(node: Dict[str, Any]) -> str:
        action = node.get("action", "")
        if not action:
            return "Unknown Operation"
        
        words = action.replace("_", " ").strip()
        result = []
        current_word = []
        
        for char in words:
            if char.isupper() and current_word:
                result.append("".join(current_word))
                current_word = [char]
            else:
                current_word.append(char)
        
        if current_word:
            result.append("".join(current_word))
        
        filtered = [word for word in result if word.lower() not in ["trigger", "action", "v2"]]
        formatted = " ".join(word.capitalize() for word in " ".join(filtered).split())
        
        return formatted if formatted else "Unknown Operation"
    
    # Helper: Get node type
    def get_type(node: Dict[str, Any]) -> str:
        selected_api = node.get("selected_api", "").lower()
        action = node.get("action", "").lower()
        
        if "filter" in selected_api or action == "filter":
            return "tool"
        
        builtin_tools = {"filter", "formatter", "paths", "delay", "schedule", 
                        "webhook", "email", "sms", "code", "digest", "looping"}
        
        for tool in builtin_tools:
            if tool in selected_api:
                return "tool"
        
        return "app"
    
    # Process each zap
    for zap in zapier_data["zaps"]:
        zap_id = zap.get("id")
        zap_title = zap.get("title", "Untitled")
        zap_status = zap.get("status", "unknown")
        
        if "nodes" not in zap:
            continue
        
        nodes = zap["nodes"]
        
        # Build parent-child relationships
        node_ids = list(nodes.keys())
        root_nodes = [nid for nid in node_ids if nodes[nid].get("parent_id") is None]
        
        # Parse nodes recursively
        def parse_node_chain(node_id: str, prev_node_id: Optional[str] = None):
            if node_id not in nodes:
                return
            
            node = nodes[node_id]
            
            # Create parsed node
            parsed_node = {
                "id": str(node_id),
                "zap_id": zap_id,
                "is_trigger": prev_node_id is None,
                "action": get_action(node),
                "operation_name": get_operation_name(node),
                "service": get_service(node),
                "type": get_type(node),
                "raw_json": node
            }
            
            all_nodes.append(parsed_node)
            
            # Create edge if there's a previous node
            if prev_node_id:
                all_edges.append({
                    "from_node_id": str(prev_node_id),
                    "to_node_id": str(node_id),
                    "zap_id": zap_id
                })
            
            # Find and parse child nodes
            for child_id, child_node in nodes.items():
                if child_node.get("parent_id") == int(node_id):
                    parse_node_chain(child_id, node_id)
        
        # Start parsing from root nodes
        for root_id in root_nodes:
            parse_node_chain(root_id)
        
        # Store zap info
        zap_info.append({
            "id": zap_id,
            "title": zap_title,
            "status": zap_status,
            "node_count": len([n for n in all_nodes if n["zap_id"] == zap_id])
        })
    
    return {
        "nodes": all_nodes,
        "edges": all_edges,
        "zaps": zap_info
    }


# Funktion zur ASCII Viz
def print_zapier_graph(parsed_data: Dict[str, Any]) -> None:
    
    nodes = parsed_data["nodes"]
    edges = parsed_data["edges"]
    zaps = parsed_data["zaps"]
    
    for zap in zaps:
        zap_id = zap["id"]
        print(f"\n📦 Zap: {zap['title']} (Status: {zap['status']})")
        print("=" * 60)
        
        zap_nodes = {n["id"]: n for n in nodes if n["zap_id"] == zap_id}
        zap_edges = [e for e in edges if e["zap_id"] == zap_id]
        
        adjacency = {}
        children = set()
        
        for edge in zap_edges:
            from_id = edge["from_node_id"]
            to_id = edge["to_node_id"]
            
            if from_id not in adjacency:
                adjacency[from_id] = []
            adjacency[from_id].append(to_id)
            children.add(to_id)
        
        roots = [nid for nid in zap_nodes.keys() if nid not in children]
        
        def print_node(node_id: str, prefix: str = "", is_last: bool = True):
            node = zap_nodes.get(node_id)
            if not node:
                return
            
            service_name = f"{node['action']} | {node['operation_name']} ({node['service']} - {node['type']})"
            display = f"\033[1m{service_name}\033[0m"
            
            connector = "└── " if is_last else "├── "
            print(f"{prefix}{connector}{display}")
            
            kids = adjacency.get(node_id, [])
            child_prefix = prefix + ("    " if is_last else "│   ")
            
            for idx, child_id in enumerate(kids):
                print_node(child_id, child_prefix, idx == len(kids) - 1)
        
        for root in roots:
            print_node(root)
        
        print("=" * 60)


# Test
if __name__ == "__main__":

    # JSON laden (ein Ordner zurück, dann in data/)
    with open('/Users/jonasreimer/Applications/trace-parser/data/zapier.json') as f:      
        zapier_json = json.load(f)
    
    # Parse
    result = parse_zapier(zapier_json)
    
    print (result)
    
    # Visualisierung
    print_zapier_graph(result)