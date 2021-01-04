import { debounce } from "debounce";
import onChange from "on-change";
import setValue from 'set-value';
import { DiagramStore } from "./diagram-store";
import { Action, ActionTask } from "./interfaces/Action";
import { clone, patchObject } from "./utils";

/**
 * A Helper class that detects changes in Diagram's component properties and add changes history to the ActionsArchiver
 */
export class PropsChangeArchiver{

  private data: any;
  private actions: any  = {};
  private debouncers: any = {};
  private filter: ( (path: string, value: any) => boolean ) | null = null;
  private instance: any;
  private _locked: boolean = true;

  constructor(options: PropsChangeArchiverOptions | null){
    if(!options) return;
    const { instance, props, debounce, filter } = options;
    this.instance = instance;
    this.filter = filter;
    let data = patchObject({}, instance, props);
    data = onChange(data, (...args) => this.onChange(...args));
    this.data = data;

    for(let p of props){
      this.prepareProperty(p);
      const interval = debounce[p];
      if(typeof interval == 'number'){
        this.createDebouncer(p, interval);
      }
    }

  }

  /**
   * Immidiatly adds any pending changes actions that ware debounced to the ActionsArchiver stack
   * @param rootProp
   */
  public flush(rootProp: string){
    const debouncer = this.debouncers[rootProp];
    if(debouncer){
      debouncer.flush();
    }
  }

  /**
   * Indicate whether the instance is Locked or not (a locked instance will ignore all changes)
   */
  private isLocked(){
    return this._locked || this.store?.actionsArchiver.isLocked();
  }

  /**
   * Handles the changes and create for them the change action, than adds it to the ActionsArchiver or schedule it for debounced properties
   * @param path
   * @param value
   * @param prevValue
   * @param name
   */
  private onChange(path: string, value: any, prevValue: any, name: string){
    if(path == 'properties.priority' && value == -Infinity){
      throw new Error('got value ' + value)
    }
    if(this.isLocked() || (this.filter && !this.filter(path, value))) return;
    // console.log(path, value);

    const action = this.craftAction(path, value, prevValue);

    const rootProp = path.split('.')[0];
    const debouncer = this.debouncers[rootProp];

    if(typeof debouncer == 'function'){
      this.actions[rootProp].push(action);
      debouncer();
    }else{
      this.pushAction(action);
    }

  }

  /**
   * Creates debouncer instance for the specifed property
   * @param prop Property name
   * @param interval Debounce time in milliseconds
   */
  private createDebouncer(prop: string, interval: number){
    this.actions[prop] = [];
    this.debouncers[prop] = debounce(() => {
      this.publishActions(prop);
    }, interval);
  }

  /**
   * Creates proxy for the specified property
   * @param prop
   */
  private prepareProperty(prop: string){
    const data = this.data;
    Object.defineProperty(this.instance, prop, {
      set(value){
        data[prop] = value;
      },
      get(){
        return data[prop];
      }
    });
  }

  /**
   * Create the change action for the specified property path and its old and new value
   * @param path Path of the property that changed its value
   * @param value The new value
   * @param prevValue The old value
   */
  private craftAction(path: string, value: any, prevValue: any): Action{
    const _value = clone(value);
    const _prevValue = clone(prevValue);

    const _this = this;
    const action = {
      undo: [
        {
          events: [],
          do(){
            const obj = onChange.target(_this.data);
            _this.lock();
            setValue(obj, path, _prevValue)
            _this.unlock();
          }
        }
      ],
      redo: [
        {
          events: [],
          do(){
            const obj = onChange.target(_this.data);
            _this.lock();
            setValue(obj, path, _value)
            _this.unlock();
          }
        }
      ]
    };

    return action;
  }

  /**
   * Adds actions of the debounced properties to ActionsArchiver stack
   * @param prop
   */
  private publishActions(prop: string){
    const actions: Action[] = this.actions[prop];
    this.actions[prop] = [];

    if(actions instanceof Array && actions.length > 0){
      const undos: ActionTask[] = [];
      const redos: ActionTask[] = [];
      actions.forEach(ac => undos.push(...ac.undo));
      actions.forEach(ac => redos.push(...ac.redo));
      this.pushAction({
        undo: undos.reverse(),
        redo: redos
      });
    }
  }

  /**
   * Adds action to ActionsArchiver stack
   * @param action
   */
  private pushAction(action: Action){
    this.store?.actionsArchiver.push(action);
  }

  /**
   * Returns the Diagram Store instance of the Associated Diagram Component
   */
  private get store(): DiagramStore{
    return this.instance.store;
  }

  /**
   * Locks this instance (ultimatly making it to ignore changes)
   */
  public lock(){
    this._locked = true;
  }

  /**
   * Unlocks this instance (ultimatly making it to handle changes)
   */
  public unlock(){
    this._locked = false;
  }

}

export interface PropsChangeArchiverOptions{
  instance: any;
  props: string[];
  debounce: any;
  filter: ( (path: string, value: any) => boolean ) | null;
}
