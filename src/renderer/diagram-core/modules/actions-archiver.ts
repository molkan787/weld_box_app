import { DiagramStore } from "../diagram-store";
import { Action, ActionTask } from "../interfaces/Action";

export class ActionsArchiver{

  private readonly stack: Action[] = [];
  private pointer: number = -1;

  constructor(readonly store: DiagramStore){
    console.log(this)
  }

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
    const action = this.current();
    if(action){
      const tasks = action.undo;
      for(const t of tasks){
        this.doTask(t);
      }
    }
  }

  public redo(){
    const action = this.next();
    if(action){
      const tasks = action.redo;
      for(const t of tasks){
        this.doTask(t);
      }
    }
  }

  private doTask(task: ActionTask){
    task.do();
    for(let event of task.events){
      this.store.emit(event, task.eventsPayload || {});
    }
  }

}
