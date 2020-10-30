import { Node } from "../diagram-core";
import { MyEdge } from "../my-diagram/my-edge";

export declare type NodesRefs = Map<number, Node>;

export interface ObjectCraftResult{
  nodes: Node[];
  nodesRefs: NodesRefs;
  edges: MyEdge[];
}

export interface NodeCraftResult{
  node: Node;
  ref: number;
}
