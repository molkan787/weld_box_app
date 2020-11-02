import { ObjectCopyResult } from "./ObjectCopyResult";

export interface DiagramExportData{

  idPointer: number;
  objects: ObjectCopyResult[];
  currentNodeRef?: number;
  zoomTransforms: ZoomTransformData[];

}

export declare type ZoomTransformData = [number, { x: number, y: number, k: number }];
