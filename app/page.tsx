import * as zaps from "../data/zapier.json";
import * as workflow from "../data/n8n.json";
import * as scenario from "../data/make.json";
import { parseEdges, parseN8n } from "@/lib/n8n_parser";
import parseMake from "@/lib/make_parser";
import AuthButton from "./components/AuthButton";

export default function Home() {
  // parseN8n(workflow as any);
  // parseMake(scenario as any);

  return (
    <div className="w-full h-svh flex justify-center items-center">
      <AuthButton />
    </div>
  );
}
