import { DiagramStore } from "./diagram-store";
import { Action } from "./interfaces/Action";

/**
 * Base class for Diagram Modules, also contains wrappers around central systems
 */
export class DiagramModule{

  constructor(
    readonly store: DiagramStore,
    readonly name: string
  ){
    if(!name){
      throw new Error('Module name cannot be empty');
    }
  }

  public get stateSnaper(){
    return this.store.stateSnaper;
  }

  /**
   * Returns whether the Module is active or not
   */
  public get isActive(){
    return this.store.activeModule === this;
  }

  /**
   * Returns whether the Module is inactive or not
   */
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

  /**
   * Adds action to ActionsArchiver's stack
   * @param action The Action to be added
   */
  protected pushAction(action: Action){
    this.store.actionsArchiver.push(action);
  }

  protected enableActionGrouping(){
    this.store.actionsArchiver.enableGrouping();
  }

  protected disableActionGrouping(){
    this.store.actionsArchiver.disableGrouping();
  }

  protected lockActionsArchiver(){
    this.store.actionsArchiver.lock();
  }

  protected unlockActionsArchiver(){
    this.store.actionsArchiver.unlock();
  }

}
