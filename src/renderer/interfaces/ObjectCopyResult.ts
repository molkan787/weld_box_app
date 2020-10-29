import { AttachType } from "../diagram-core";
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
  name: string;
  properties: any;
}

export interface NodeCloneData extends CommonCloneDataProps{
  ref: number;
  position: Position;
  size: Size;
  parentRef?: number;
}

export interface StateCloneData extends NodeCloneData{
  statementBlocks: StatementBlock[];
  showContent: boolean;
}

export interface EventCloneData extends NodeCloneData{}

export interface MessageCloneData extends NodeCloneData{
  body: MessageDataItem[];
}

export interface EdgeCloneData extends CommonCloneDataProps{
  originId: number;
  shapePoints: Position[];
  source: EdgeConnectionCloneData;
  target: EdgeConnectionCloneData;
}

export interface EdgeConnectionCloneData{
  position?: Position,
  offset?: Position,
  attachType: AttachType,
  nodeWall: Side,
  nodeRef: number,
}
