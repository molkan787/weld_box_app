import { ipcRenderer } from "electron";
import { projectsManager } from "./projects-manager";

export class AppCloseHandler{

  constructor(){
    ipcRenderer.on('close', () => this.handleCloseEvent());
  }

  private async handleCloseEvent(){
    const canClose = await projectsManager.canLeaveCurrentProject();
    if(canClose){
      ipcRenderer.send('exit-now');
    }
  }

}

export const appCloseHandler = new AppCloseHandler();
