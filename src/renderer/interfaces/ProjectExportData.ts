import { ThreadExportData } from "./ObjectExportData";

export interface ProjectExportData{
  attributes:{
    uuid: string;
    name : string;
    architecture: '8' | '16' | '32';
    build_priority: 'memory' | 'execution';
    headers: string;
  };
  body: ThreadExportData[]  ;
}
