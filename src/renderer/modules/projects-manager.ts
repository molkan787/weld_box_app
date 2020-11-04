import { Component } from "../diagram-core/components/component";
import { readFile, writeFile } from "../helpers/fs";
import { ProjectFileData } from "../interfaces/ProjectFileData";
import { ProjectSetting } from "../interfaces/ProjectSetting";
import { MyDiagram } from "../my-diagram/my-diagram";
import { StatusController } from "../status-controller";
import { store } from "../store";
import { DiagramProject } from "./diagram-project";

const FORMAT_CHECK_VALUE = 31102020;

class ProjectsManager{

  private diagramProject = new DiagramProject();

  public async setSetting(setting: ProjectSetting){
    store.state.projectSetting = setting;
    await this.save();
  }

  public create(setting: ProjectSetting){
    this.close();
    StatusController.setStatusText('Creating new project...');
    Component.idPointer = 1;
    const diagram = new MyDiagram('#canvas');
    diagram.buildInitialDiagram();
    store.state.projectSetting = setting;
    store.state.diagram = diagram;
    StatusController.setStatusText(null);
  }

  public close(){
    StatusController.setStatusText('Closing project...');
    store.state.projectSetting = null;
    store.state.diagram = null;
    const canvas = <HTMLElement>document.getElementById('canvas');
    canvas.innerHTML = '';
    StatusController.setStatusText(null);
  }

  public async save(){
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

    await writeFile(projectSetting.location, json);
    StatusController.setStatusText(null);
    console.log('after writeFile')
  }

  public async load(filename: string){
    this.close();
    StatusController.setStatusText(`Loading project ${filename}...`);
    const raw = await readFile(filename);
    const project = <ProjectFileData>JSON.parse(raw);
    if(project?.formatCheck !== FORMAT_CHECK_VALUE){
      throw new Error('Invalid data format');
    }
    const diagram = new MyDiagram('#canvas');
    const { setting, data } = project;
    store.state.projectSetting = setting;
    store.state.diagram = diagram;

    setTimeout(() => { // required for vue components to react correctly (temporary solution)
      this.diagramProject.import(diagram, data);
      StatusController.setStatusText(null);
      setTimeout(() => {
        diagram.clearActionsArchiver();
      }, 1000)
    }, 1);
  }

}


export const projectsManager = new ProjectsManager();
