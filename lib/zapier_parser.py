import json
from typing import List, Dict, Any, Optional, Set

from pyparsing import Path
import re



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
    
    all_nodes = []
    all_edges = []
    zap_info = []
    
    if "zaps" not in zapier_data:
        return {"nodes": [], "edges": [], "zaps": []}
    
    # Helper: node action type
    def get_action(node: Dict[str, Any]) -> Optional[str]:
        type_of = node.get("type_of", "").lower()
        action = node.get("action", "").lower()
        
        if type_of == "read":
            return "read"
        elif type_of == "read_bulk":
            return "read"
        elif type_of == "search":
            return "read"
        elif type_of == "search_or_write": #Added according to zapier docs
            return "write"
        elif type_of == "search_and_write":
            return "write"
        elif type_of == "write":
            return "write"
        elif type_of == "update":
            return "update"
        elif type_of == "delete":
            return "delete"
        elif type_of == "filter":
            return "read"
        
        return None
    
    # Helper: service name
    def get_service(node: Dict[str, Any]) -> str:
        selected_api = node.get("selected_api", "")
        service = selected_api.split("CLIAPI")[0] if "CLIAPI" in selected_api else selected_api
        service = service.split("@")[0]
        service = re.sub(r'(?i)v\d+$', '', service).strip() # remove trailing version markers like V2, v3, etc.
        service = re.sub(r'(?i)api$', '', service).strip()  # remove trailing "API"
        
        result = []
        for char in service:
            if char.isupper() and result:
                result.append("-") #Delimit multi-word service names with hyphen
            result.append(char.lower())
        
        return "".join(result).strip() or "unknown"
    
    # Helper:  operation name
    def get_operation_name(node: Dict[str, Any]) -> str:
        action = node.get("action", "")
        if not action:
            return "Unknown Operation"

        parts = action.replace("_", " ").split()

        # drop generic words and version tokens like v2, v10, v3
        filtered = [
            p for p in parts
            if p.lower() not in {"trigger", "action"}
            and not re.fullmatch(r"v\d+", p.lower())
        ]

        if not filtered:
            return "Unknown Operation"

        return " ".join(p.capitalize() for p in filtered)
    
    # Helper: node type
    def get_type(node: Dict[str, Any]) -> str:
        action = node.get("action", "")

        builtin_tools = {"filter"} #TODO einmal alle builtins auflisten, ggf. dynamisieren

        # check for router
        if get_operation_name(node) == "Branch":
                return "router"
        
        for tool in builtin_tools: 
            if tool in action:
                return "tool"
        
        return "app"
    
    #Helper: zap infos
    for zap in zapier_data["zaps"]:
        zap_id = zap.get("id")
        zap_title = zap.get("title", "Untitled")
        zap_status = zap.get("status", "unknown")
        
        if "nodes" not in zap:
            continue
        
        nodes = zap["nodes"]
        
        # parent-child relationships
        node_ids = list(nodes.keys())
        root_nodes = [nid for nid in node_ids if nodes[nid].get("parent_id") is None]
        
        # nodes recursively parsen
        def parse_node_chain(node_id: str, prev_node_id: Optional[str] = None):
            if node_id not in nodes:
                return
            
            node = nodes[node_id]
            
            # node info
            parsed_node = {
                "id": str(node_id),
                "zap_id": zap_id,
                "is_trigger": prev_node_id is None, #ist nicht das root element immer trigger?
                "action": get_action(node),
                # object fehlt
                "operation_name": get_operation_name(node),
                "service": get_service(node),
                "type": get_type(node),
                "raw_json": node
            }
            
            all_nodes.append(parsed_node)
            
            # edge erstellen, wenn es eine node davor gibt
            if prev_node_id:
                all_edges.append({
                    "from_node_id": str(prev_node_id),
                    "to_node_id": str(node_id),
                    "zap_id": zap_id
                })
            
            # child nodes parsen
            for child_id, child_node in nodes.items():
                if child_node.get("parent_id") == int(node_id):
                    parse_node_chain(child_id, node_id)
        
        # bei root nodes starten
        for root_id in root_nodes:
            parse_node_chain(root_id)
        
        # zap info
        zap_info.append({
            "id": zap_id,
            "title": zap_title, #gibt keine Description
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
        print(f"\n Zap: {zap['title']} (Status: {zap['status']})")
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

    path = Path("data/zapier.json")
if not path.exists():
    raise FileNotFoundError(path)

with path.open() as f:
    zapier_json = json.load(f)


    
    # Parse
    result = parse_zapier(zapier_json)

    # print(json.dumps(result.get("nodes"), indent=2))

    # Visualisierung
    print_zapier_graph(result)