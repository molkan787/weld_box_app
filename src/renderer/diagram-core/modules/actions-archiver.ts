import { MODULES } from "../constants";
import { DiagramStore } from "../diagram-store";
import { Action, ActionTask } from "../interfaces/Action";
import { DiagramModule } from "../module";

export class ActionsArchiver extends DiagramModule{

  private readonly stack: Action[] = [];
  private pointer: number = -1;

  constructor(readonly store: DiagramStore){
    super(store, MODULES.ACTIONS_ARCHIVER);
    console.log(this)
  }

  /**
   * Push an action to the stack
   */
  public push(action: Action){
    if(this.pointer < this.stack.length - 1){
      this.stack.splice(this.pointer + 1);
    }
    this.stack.push(action);
    this.pointer++;
  }

  private current(): Action | null{
    if(this.pointer == -1){
      return null;
    }
    return this.stack[this.pointer--];
  }

  private next(): Action | null{
    if(this.pointer >= this.stack.length - 1){
      return null;
    }
    this.pointer++;
    return this.stack[this.pointer];
  }

  public undo(){
    this.activate();
    const action = this.current();
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
    task.do();
    for(let event of task.events){
      this.store.emit(event, task.eventsPayload || {});
    }
  }

}
