import { ipcRenderer } from "electron";
import { projectsManager } from "./projects-manager";

/**
 * Handles unsaved project alert before closing the application
 */
export class AppCloseHandler{

  constructor(){
    ipcRenderer.on('close', () => this.handleCloseEvent());
  }

  /**
   * Checks if there are unsaved changes before closing the app, and prompt the user to save them if there are unsaved changes
   */
  private async handleCloseEvent(){
    const canClose = await projectsManager.canLeaveCurrentProject();
    if(canClose){
      ipcRenderer.send('exit-now');
    }
  }

}

export const appCloseHandler = new AppCloseHandler();
