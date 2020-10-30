import { Component } from "../diagram-core/components/component";
import { readFile, writeFile } from "../helpers/fs";
import { ProjectFileData } from "../interfaces/ProjectFileData";
import { ProjectSetting } from "../interfaces/ProjectSetting";
import { MyDiagram } from "../my-diagram/my-diagram";
import { store } from "../store";
import { DiagramProject } from "./diagram-project";

const FORMAT_CHECK_VALUE = 31102020;

class ProjectsManager{

  private diagramProject = new DiagramProject();

  public create(setting: ProjectSetting){
    this.close();
    Component.idPointer = 1;
    const diagram = new MyDiagram('#canvas');
    diagram.buildInitialDiagram();
    store.state.projectSetting = setting;
    store.state.diagram = diagram;
  }

  public close(){
    store.state.projectSetting = { location: '', name: '' };
    store.state.diagram = null;
    const canvas = <HTMLElement>document.getElementById('canvas');
    canvas.innerHTML = '';
  }

  public async save(){
    const { projectSetting, diagram } = store.state;
    if(!diagram) return;

    const data = this.diagramProject.export(diagram);
    const project: ProjectFileData = {
      formatCheck: FORMAT_CHECK_VALUE,
      setting: projectSetting,
      data: data
    }
    const json = JSON.stringify(project);

    await writeFile(projectSetting.location, json);
    console.log('after writeFile')
  }

  public async load(filename: string){
    this.close();
    const raw = await readFile(filename);
    const project = <ProjectFileData>JSON.parse(raw);
    if(project?.formatCheck !== FORMAT_CHECK_VALUE){
      throw new Error('Invalid data format');
    }
    const diagram = new MyDiagram('#canvas');
    const { setting, data } = project;
    store.state.projectSetting = setting;
    store.state.diagram = diagram;
    setTimeout(() => { // required for vue components to react correctly
      this.diagramProject.import(diagram, data);
    }, 1);
  }

}


export const projectsManager = new ProjectsManager();
