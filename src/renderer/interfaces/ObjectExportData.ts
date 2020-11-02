import { EventClear, EventType } from "../my-diagram/EventNode";
import { MessageType } from "../my-diagram/MessageNode";
import { EdgeType } from "../my-diagram/my-edge";
import { StateDecomposition } from "../my-diagram/state";
import { MessageDataItem } from "./MessageDataItem";
import { ObjectType } from "./ObjectType";

export interface ObjectExportData{
  attributes: {
    id: number;
    what: ObjectType;
    name: string;
  };
  body?: any[];
}

export interface ThreadExportData extends ObjectExportData{
  properties: {
    decomposition: StateDecomposition;
    execution: number;
  };
  body: ObjectExportData[];
}

export interface StateExportData extends ObjectExportData{
  properties: {
    decomposition: StateDecomposition;
    priority: number;
    historic: 1 | 0;
  };
  body: ObjectExportData[];
}

export interface StatementBlockExportData extends ObjectExportData{
  properties: {
    execution: string;
  },
  body: string[]
}

export interface EdgeExportData extends ObjectExportData{
  properties: {
    origin: number;
    destination: number;
    priority: number;
    type: EdgeType;
    condition: string;
  }
}

export interface MessageExportData extends ObjectExportData{
  properties: {
    queue_length: number;
    type: MessageType;
  };
  body: MessageDataItem[];
}

export interface EventExportData extends ObjectExportData{
  properties: {
    clear: EventClear;
    type: EventType;
  }
}
