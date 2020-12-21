import { EVENTS, MODULES } from "../constants";
import { DiagramStore } from "../diagram-store";
import { Action, ActionTask } from "../interfaces/Action";
import { DiagramModule } from "../module";

/**
 * Undo/Redo system, handles undoing and redoing the user actions
 */
export class ActionsArchiver extends DiagramModule{

  /** Actions stack */
  public stack: Action[] = [];
  /** Current action index */
  public pointer: number = -1;
  /** Indicates whether action grouping in enabled or not, when enabled every pushed action will be merged with the current action */
  private grouping: boolean = false;
  /** Indicate whether ActionsArchiver is locked or not, when locked no action can be pushed/added */
  private locked: boolean = false;

  constructor(readonly store: DiagramStore){
    super(store, MODULES.ACTIONS_ARCHIVER);
  }

  /** Clears all actions from the stack and reset the current action pointer/index */
  public clear(){
    this.pointer = -1;
    this.stack = [];
  }

  /** Enables actions grouping */
  public enableGrouping(){
    this.grouping = true;
  }

  /** Disables actions grouping */
  public disableGrouping(){
    this.grouping = false;
  }

  /**
   * Returns `true` if it is locked otherwise `false`
   */
  public isLocked(){
    return this.locked;
  }

  /**
   * Locks actions adding
   */
  public lock(){
    this.locked = true;
  }

  /**
   * Unlocks actions adding
   */
  public unlock(){
    this.locked = false;
  }

  /**
   * Push an action to the stack
   */
  public push(action: Action){
    if(this.locked) return;
    this.fillMetaProps(action);
    if(this.grouping){
      const current = this.stack[this.pointer];
      if(current){
        current.undo.push(...action.undo);
        current.redo.push(...action.redo);
        return;
      }
    }
    if(this.pointer < this.stack.length - 1){
      this.stack.splice(this.pointer + 1);
    }
    this.stack.push(action);
    this.pointer++;
  }

  /** Returns the current action and moves the pointer back */
  private current(removeAction?: boolean): Action | null{
    if(this.pointer == -1){
      return null;
    }
    const action = this.stack[this.pointer];
    if(removeAction){
      this.stack.splice(this.pointer, 1);
    }
    this.pointer--;
    return action;
  }

  /** Returns the next action in the stack and move the pointer forward */
  private next(): Action | null{
    if(this.pointer >= this.stack.length - 1){
      return null;
    }
    this.pointer++;
    return this.stack[this.pointer];
  }

  /**
   * Undo the current action
   * @param removeAction if `true` the undone action will be also removed from stack
   */
  public undo(removeAction?: boolean){
    this.activate();
    const action = this.current(removeAction);
    console.log('undo', action);
    this.store.forceSynchronousUpdates = true;
    if(action){
      const tasks = action.undo;
      for(const t of tasks){
        this.doTask(t);
      }
    }
    this.store.forceSynchronousUpdates = false;
    this.deactivate();
  }

  /** Redo the previously undone action */
  public redo(){
    this.activate();
    const action = this.next();
    console.log('redo', action);
    this.store.forceSynchronousUpdates = true;
    if(action){
      const tasks = action.redo;
      for(const t of tasks){
        this.doTask(t);
      }
    }
    this.store.forceSynchronousUpdates = false;
    this.deactivate();
  }

  /**
   * Exectute action's task
   * @param task Task to execute
   */
  private doTask(task: ActionTask){
    this.store.emit(EVENTS.DIAGRAM_JUMP_TO_NODE, { node: task.openNode });
    task.do();
    for(let event of task.events){
      this.store.emit(event, { ...task.eventsPayload, isRestore: true });
    }
  }

  /** Fill metadata in an action (ex: Set the opened node at the time the action was pushed/added) */
  private fillMetaProps(action: Action){
    const openNode = this.store.currentlyOpenNode;
    const tasks = action.undo.concat(action.redo);
    for(let i = 0; i < tasks.length; i++){
      tasks[i].openNode = openNode;
    }
  }

}
