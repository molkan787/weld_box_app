import { Edge } from "../components/edge";
import { Node } from "../components/node";

export interface DiagramEvent{
  /** Type of the event (name) */
  type?: string;
  /** Indicates whether the event was prevented or not */
  prevented?: boolean;
  /**
   * Indicates whether this event was emitted because of undoing or redoing a user action,
   * if `true` no actions should be added to the Undo/Redo system (ActionArchiver) in response to this event
   */
  readonly isRestore?: boolean;
  /** The sender of this modules (usually a Diagram Module) */
  readonly sender?: any;
  /** The source event and in consequence triggered this event */
  readonly sourceEvent?: any;
  /** The Node instance in subject (The value is none null on all event with a prefix of 'NODE_', otherwise its null) */
  readonly node?: Node | null;
  /** The Edge instance in subject (The value is none null on all event with a prefix of 'EDGE_', otherwise its null) */
  readonly edge?: Edge | null;
  /** It can be anything, its depends the emitted event */
  readonly data?: any;
  /**
   * Indicates whether this event was simulated,
   * ex: after loading a project, the system emits NODE_BBOX_CHANGED event to render/update nodes,
   * in this case the events should be ignored, the only module that respond to it should be the renderer
   */
  readonly simulated?: boolean;
  /**
   * Indicates whether mutations to diagram object in subject should be skiped or not, when handling this event
   */
  readonly skipMutation?: boolean;
  /**
   * Indicates whether rendering/rendering of the diagram object in subject should be skiped or not, when handling this event
   */
  readonly skipRendering?: boolean;
}
