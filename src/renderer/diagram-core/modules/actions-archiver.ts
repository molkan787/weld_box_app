import { EVENTS, MODULES } from "../constants";
import { DiagramStore } from "../diagram-store";
import { Action, ActionTask } from "../interfaces/Action";
import { DiagramModule } from "../module";

export class ActionsArchiver extends DiagramModule{

  private stack: Action[] = [];
  private pointer: number = -1;
  private grouping: boolean = false;

  constructor(readonly store: DiagramStore){
    super(store, MODULES.ACTIONS_ARCHIVER);
  }

  public clear(){
    this.pointer = -1;
    this.stack = [];
  }

  public enableGrouping(){
    this.grouping = true;
  }

  public disableGrouping(){
    this.grouping = false;
  }

  /**
   * Push an action to the stack
   */
  public push(action: Action){
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

  private next(): Action | null{
    if(this.pointer >= this.stack.length - 1){
      return null;
    }
    this.pointer++;
    return this.stack[this.pointer];
  }

  public undo(removeAction?: boolean){
    this.activate();
    const action = this.current(removeAction);
    console.log(action)
    if(action){
      const tasks = action.undo;
      for(const t of tasks){
        this.doTask(t);
      }
    }
    this.deactivate();
  }

  public redo(){
    this.activate();
    const action = this.next();
    if(action){
      const tasks = action.redo;
      for(const t of tasks){
        this.doTask(t);
      }
    }
    this.deactivate();
  }

  private doTask(task: ActionTask){
    this.store.emit(EVENTS.DIAGRAM_JUMP_TO_NODE, { node: task.openNode });
    task.do();
    for(let event of task.events){
      this.store.emit(event, { ...task.eventsPayload, isRestore: true });
    }
  }

  private fillMetaProps(action: Action){
    const openNode = this.store.currentlyOpenNode;
    const tasks = action.undo.concat(action.redo);
    for(let i = 0; i < tasks.length; i++){
      tasks[i].openNode = openNode;
    }
  }

}
