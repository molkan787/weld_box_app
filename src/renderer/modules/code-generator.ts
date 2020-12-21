import path from "path";
import { writeFile } from "../helpers/fs";
import { config } from "../config";
import { Diagram } from "../diagram-core";
import { GenerateCodeFile, GenerateCodeResponse } from "../interfaces/GenerateCodeResponse";
import { ProjectExportData } from "../interfaces/ProjectExportData";
import { ProjectSetting } from "../interfaces/ProjectSetting";
import { DataExporter } from "./data-exporter";
import Axios from "axios";
import { UserID } from "./user-id";

/**
 * This module handles the process of generating code from the diagram
 */
export class CodeGenerator{

  /**
   * Generates code for the specified Diagram
   * @param diagram Diagram instance to generate from it the code
   * @param setting Projects settings
   */
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

  /**
   * Send request to the remote server for generate the code
   * @param data Diagram's components data
   */
  private async request(data: ProjectExportData): Promise<GenerateCodeResponse>{
    const userId = UserID.getId();
    console.log("userId", userId)
    const response = await Axios.post(config.BT_GENERATE_CODE_URL, data, {
      headers: {
        user_token: userId
      }
    });
    return response.data;
  }

  /**
   * Saves the response from the remote server
   * @param setting
   * @param files
   */
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
