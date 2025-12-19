import * as zaps from "../data/zapier.json";
import * as workflow from "../data/n8n.json";
import * as scenario from "../data/make.json";
import { parseEdges, parseN8n } from "@/lib/n8n_parser";
import parseMake from "@/lib/make_parser";


export default function Home() {

  parseN8n(workflow as any);
  // parseMake(scenario as any);





  return null;
}
