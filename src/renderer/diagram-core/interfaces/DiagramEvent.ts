import { Node } from "../components/node";

export interface DiagramEvent{
  type?: string;
  readonly sourceEvent?: any;
  readonly node: Node
}
