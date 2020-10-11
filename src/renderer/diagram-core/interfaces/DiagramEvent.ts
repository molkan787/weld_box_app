import { Edge } from "../components/edge";
import { Node } from "../components/node";

export interface DiagramEvent{
  type?: string;
  readonly sourceEvent?: any;
  readonly node?: Node,
  readonly edge?: Edge,
  readonly data?: any
}
