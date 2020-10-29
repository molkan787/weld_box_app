import { Node } from "../diagram-core";
import { MyEdge } from "../my-diagram/my-edge";

export interface ObjectCraftResult{
  nodes: Node[];
  edges: MyEdge[];
}

export interface NodeCraftResult{
  node: Node;
  ref: number;
}
