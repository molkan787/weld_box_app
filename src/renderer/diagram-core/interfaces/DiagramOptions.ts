import { EdgeInstanceCreator } from "./EdgeInstanceCreator";

export interface DiagramOptions {
  width: number;
  height: number;
  chartClasses?: string;
  nodeBorderWidth: number;
  nodeHeaderHeight: number;
  edgeFactory?: EdgeInstanceCreator;
}
