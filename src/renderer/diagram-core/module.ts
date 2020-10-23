import { DiagramStore } from "./diagram-store";

export class DiagramModule{

  constructor(
    readonly store: DiagramStore,
    readonly name: string
  ){}

  public get isActive(){
    return this.store.activeModule === this;
  }

  public get isInactive(){
    return this.store.activeModule !== this;
  }

  protected activate(){
    this.store.activateModule(this);
  }

  protected deactivate(){
    this.store.deactiveModule(this);
  }

}
