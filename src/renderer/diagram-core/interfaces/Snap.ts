import { Edge, MultipartEdgeLocation, MultipartEdgeType } from "../components/edge";
import { AttachType, EdgeConnection } from "../components/edge-connection";
import { Node } from "../components/node";
import { Side } from "../helpers/geometry";
import { Position } from "./Position";
import { Size } from "./Size";

export type NodeSnap = NodeSnapState[];

export interface NodeSnapState{
  node: Node;
  parent: Node | null;
  size: Size;
  position: Position;
  // edges: EdgeSnap[];
}

export interface EdgeSnap{
  edge: Edge;
  shapePoints: Position[];
  source: EdgeConnectionSnap;
  target: EdgeConnectionSnap;
  isMultipart: boolean;
  multipartLocation: MultipartEdgeLocation;
  multipartType: MultipartEdgeType;
}

export interface EdgeConnectionSnap{
  edgeConnection: EdgeConnection;
  position?: Position;
  offset?: Position;
  attachType: AttachType;
  nodeWall: Side;
  node: Node | null;
}
