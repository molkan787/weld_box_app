import { EdgeInstanceCreator } from "./EdgeInstanceCreator";

export interface DiagramOptions {
  /** Canvas width in pixel */
  width: number;
  /** Canvas height in pixel */
  height: number;
  /** CSS classes to be added to the Diagram's root element */
  chartClasses?: string;
  /** Node's border width used for internal calculation (must be same as in element's style) */
  nodeBorderWidth: number;
  /** Node's header height used for internal calculation (must be same as in element's style) */
  nodeHeaderHeight: number;
  /**
   * A factory function that receives source & target edge connection as parameters
   * and return an `Edge` instance, should be used when extending the `Edge` class
   * so that the EdgeDrawer module uses that extended Edge
   */
  edgeFactory?: EdgeInstanceCreator;
}
