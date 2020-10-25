import { Node } from "../components/node";
import { DiagramEvent } from "./DiagramEvent";

/**
 * An object containing functions that either undo or redo the action,
 * also events that need to be emitted after action was undone or redone
 */
export interface Action{
  undo: ActionTask[];
  redo: ActionTask[];
}

export interface ActionTask{
  /**
   * The node that was open as a sub-chart at the time when this task happend.
   * This property should be assined by the ActionsArchiver module
   */
  openNode?: Node | null;
  /** Events names that need to be emitted after calling do() function */
  events: string[];
  /** Payload of the events  that need to be emitted */
  eventsPayload?: DiagramEvent;
  /** A function to apply the required changes (undo steps or redo steps) */
  do: Function;
}
