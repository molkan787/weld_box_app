import path from "path";
import { writeFile } from "../helpers/fs";
import { config } from "../config";
import { Diagram } from "../diagram-core";
import { GenerateCodeFile, GenerateCodeResponse } from "../interfaces/GenerateCodeResponse";
import { ProjectExportData } from "../interfaces/ProjectExportData";
import { ProjectSetting } from "../interfaces/ProjectSetting";
import { DataExporter } from "./data-exporter";
import Axios from "axios";

export class CodeGenerator{

  public async generate(diagram: Diagram, setting: ProjectSetting){
    const data = new DataExporter().exportData(diagram, setting);
    console.log(data);
    const response = await this.request(data);
    if(response.status == 'success' && !response.error){
      await this.saveFiles(setting, response.data.files);
      return response.data.message;
    }else{
      throw new Error(response.error);
    }
  }

  private async request(data: ProjectExportData): Promise<GenerateCodeResponse>{
    const response = await Axios.post(config.BT_GENERATE_CODE_URL, data);
    return response.data;
  }

  private async saveFiles(setting: ProjectSetting, files: GenerateCodeFile[]){
    const { sourcesDir, headersDir } = setting;
    for(let file of files){
      const { name, type, content } = file;
      let filename: string = '';
      if(type == 'source'){
        filename = path.join(sourcesDir, name);
      }else if(type == 'header'){
        filename = path.join(headersDir, name);
      }
      if(filename){
        await writeFile(filename, content);
      }
    }
  }

}
