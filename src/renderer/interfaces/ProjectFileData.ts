import { DiagramExportData } from "./DiagramExportData";
import { ProjectSetting } from "./ProjectSetting";

export interface ProjectFileData{
  formatCheck: number,
  setting: ProjectSetting;
  data: DiagramExportData;
}
