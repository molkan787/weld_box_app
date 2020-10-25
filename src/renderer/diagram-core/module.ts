import { DiagramStore } from "./diagram-store";
import { Action } from "./interfaces/Action";

export class DiagramModule{

  constructor(
    readonly store: DiagramStore,
    readonly name: string
  ){}

  public get stateSnaper(){
    return this.store.stateSnaper;
  }

  public get isActive(){
    return this.store.activeModule === this;
  }

  public get isInactive(){
    return this.store.activeModule !== this;
  }

  /**
   * Sets the calling module as the currently active module, Giving him the priority in handling events
   */
  protected activate(){
    this.store.activateModule(this);
  }

  /**
   * Unsets the calling module as the currently active module, Taking him the priority in handling events
   */
  protected deactivate(){
    this.store.deactiveModule(this);
  }

  protected pushAction(action: Action){
    this.store.actionsArchiver.push(action);
  }

  protected enableActionGrouping(){
    this.store.actionsArchiver.enableGrouping();
  }

  protected disableActionGrouping(){
    this.store.actionsArchiver.disableGrouping();
  }

}
