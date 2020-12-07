import { Component } from "../diagram-core/components/component";
import { Dialog } from "../dialog";
import { readFile, writeFile } from "../helpers/fs";
import { ProjectFileData } from "../interfaces/ProjectFileData";
import { ProjectSetting } from "../interfaces/ProjectSetting";
import { MyDiagram } from "../my-diagram/my-diagram";
import { StatusController } from "../status-controller";
import { store } from "../store";
import { DiagramProject } from "./diagram-project";
import { Menu } from "./menu";

const FORMAT_CHECK_VALUE = 28112020;

class ProjectsManager{

  private diagramProject = new DiagramProject();

  public async setSetting(setting: ProjectSetting){
    store.state.projectSetting = setting;
    await this.save();
  }

  public async create(setting: ProjectSetting){
    this.close();
    StatusController.setStatusText('Creating new project...');
    Component.idPointer = 1;
    const diagram = new MyDiagram('#canvas');
    diagram.buildInitialDiagram();
    store.state.projectSetting = setting;
    store.state.diagram = diagram;
    Menu.enableProjectItems(true);
    StatusController.setStatusText(null);
  }

  public async close(){
    StatusController.setStatusText('Closing project...');
    store.state.projectSetting = null;
    store.state.diagram = null;
    const canvas = <HTMLElement>document.getElementById('canvas');
    canvas.innerHTML = '';
    Menu.disableProjectItems();
    StatusController.setStatusText(null);
  }

  public async save(filename?: string){
    StatusController.setStatusText('Saving project...');
    const { projectSetting, diagram } = store.state;
    if(!diagram || !projectSetting) return;

    const data = this.diagramProject.export(diagram);
    const project: ProjectFileData = {
      formatCheck: FORMAT_CHECK_VALUE,
      setting: projectSetting,
      data: data
    }
    const json = JSON.stringify(project);

    await writeFile(filename || projectSetting.location, json);
    StatusController.setStatusText(null);
    console.log('project saved')
  }

  public async load(filename: string){
    this.close();
    StatusController.setStatusText(`Loading project ${filename}...`);
    const raw = await readFile(filename);
    const project = <ProjectFileData>JSON.parse(raw);
    if(project?.formatCheck !== FORMAT_CHECK_VALUE){
      throw new Error('Invalid project file format');
    }
    const diagram = new MyDiagram('#canvas');
    const { setting, data } = project;
    setting.location = filename;
    store.state.projectSetting = setting;
    store.state.diagram = diagram;

    setTimeout(() => { // required for vue components to react correctly (temporary solution)
      this.diagramProject.import(diagram, data);
      Menu.enableProjectItems(true);
      StatusController.setStatusText(null);
      setTimeout(() => {
        diagram.clearActionsArchiver();
        setTimeout(() => store.state.projectState.saved = true, 10)
      }, 1000)
    }, 1);
  }

  /**
   * Ask the user via Dialog window, to save or discard project changes before closing it, or to cancel the closing
   * @returns {boolean} Returns true if the user choosed to cancel
   */
  public async canLeaveCurrentProject(): Promise<boolean>{
    const s = store.state;
    // if there is no active project or it is already saved, immidiatly return , immidiatly return false
    if(!s.diagram || s.projectState.saved) return true

    const response = await Dialog.ask(
      'You have unsaved changes in the current project, Do you want to save them?',
      {
        title: 'Unsaved Project',
        buttons: [
          { text: 'Cancel', value: 'cancel' },
          { text: 'Discard', value: 'discard' },
          { text: 'Save', value: 'save', primary: true },
        ]
      }
    );
    if(response == 'cancel') return false;
    if(response == 'save'){
      await this.save();
    }
    return true;
  }

}


export const projectsManager = new ProjectsManager();
