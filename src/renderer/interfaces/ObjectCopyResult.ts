import { AttachType, MultipartEdgeLocation, MultipartEdgeType } from "../diagram-core";
import { Side } from "../diagram-core/helpers/geometry";
import { Position } from "../diagram-core/interfaces/Position";
import { Size } from "../diagram-core/interfaces/Size";
import { StatementBlock } from "../my-diagram/statement-block";
import { MessageDataItem } from "./MessageDataItem";
import { ObjectType } from "./ObjectType";

export interface ObjectCopyResult{
  objects: ObjectCloneData[];
  edges: EdgeCloneData[];
}

export interface ObjectCloneData{
  what: ObjectType;
  data: NodeCloneData | EdgeCloneData;
}

interface CommonCloneDataProps{
  /** A refference number, in most cases it should be the id of the original object */
  ref: number;
  name: string;
  properties: any;
}

export interface NodeCloneData extends CommonCloneDataProps{
  position: Position;
  size: Size;
  parentRef?: number;
}

export interface StateCloneData extends NodeCloneData{
  props: any;
  statementBlocks: StatementBlock[];
  showContent: boolean;
  isSubChart: boolean;
  codeblocksExpanded: boolean;
  codeblocksWidth: number;
}

export interface EventCloneData extends NodeCloneData{}

export interface MessageCloneData extends NodeCloneData{
  body: MessageDataItem[];
}

export interface VariableCloneData extends NodeCloneData{}

export interface JunctionCloneData extends NodeCloneData{}

export interface CommentCloneData extends NodeCloneData{
  text: string;
}

export interface EdgeCloneData extends CommonCloneDataProps{
  originId: number;
  shapePoints: Position[];
  source: EdgeConnectionCloneData;
  target: EdgeConnectionCloneData;
  isMultipart: boolean;
  multipartLocation: MultipartEdgeLocation;
  multipartType: MultipartEdgeType;
}

export interface EdgeConnectionCloneData{
  /** A refference number, in most cases it should be the id of the original object */
  ref: number;
  position?: Position,
  offset?: Position,
  attachType: AttachType,
  nodeWall: Side,
  nodeRef: number,
  bridgeToRef: number | undefined,
  bridgeFromRef: number | undefined,
}
