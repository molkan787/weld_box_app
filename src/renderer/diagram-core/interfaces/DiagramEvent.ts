import { Edge } from "../components/edge";
import { Node } from "../components/node";

export interface DiagramEvent{
  type?: string;
  readonly isRestore?: boolean;
  readonly sender?: any;
  readonly sourceEvent?: any;
  readonly node?: Node | null;
  readonly edge?: Edge | null;
  readonly data?: any;
  readonly simulated?: boolean;
  readonly skipMutation?: boolean;
  readonly skipRendering?: boolean;
}
