interface Workflow {
    name: string;
    nodes: Node[];
    connections: Record<string, any>;
}

interface Node {
    id: string;
    parameters: {
        operation?: string;
        resourource?: string;
    };
    name: string;
    type: string;
    position: number[];
}