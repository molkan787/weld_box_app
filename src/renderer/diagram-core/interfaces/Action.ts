import { DiagramEvent } from "./DiagramEvent";

export interface Action{
  undo: ActionTask[];
  redo: ActionTask[];
}

export interface ActionTask{
  openNode?: Node | null;
  events: string[];
  eventsPayload?: DiagramEvent;
  do: Function;
}
