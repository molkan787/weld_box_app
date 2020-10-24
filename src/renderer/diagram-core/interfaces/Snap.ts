import { Edge } from "../components/edge";
import { AttachType, EdgeConnection } from "../components/edge-connection";
import { Node } from "../components/node";
import { Side } from "../helpers/geometry";
import { Position } from "./Position";
import { Size } from "./Size";

export type NodeSnap = NodeSnapState[];

export interface NodeSnapState{
  node: Node,
  size: Size,
  position: Position,
  edges: EdgeSnap[]
}

export interface EdgeSnap{
  edge: Edge;
  source: EdgeConnectionSnap;
  target: EdgeConnectionSnap;
}

export interface EdgeConnectionSnap{
  edgeConnection: EdgeConnection,
  position?: Position,
  offset?: Position,
  attachType: AttachType,
  nodeWall: Side
}
