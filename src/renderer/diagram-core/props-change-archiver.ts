import { debounce } from "debounce";
import onChange from "on-change";
import setValue from 'set-value';
import { DiagramStore } from "./diagram-store";
import { Action, ActionTask } from "./interfaces/Action";
import { clone, patchObject } from "./utils";

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

  private isLocked(){
    return this._locked || this.store?.actionsArchiver.isLocked();
  }

  private onChange(path: string, value: any, prevValue: any, name: string){
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

  private createDebouncer(prop: string, interval: number){
    this.actions[prop] = [];
    this.debouncers[prop] = debounce(() => {
      this.publishActions(prop);
    }, interval);
  }

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

  private pushAction(action: Action){
    this.store?.actionsArchiver.push(action);
  }

  private get store(): DiagramStore{
    return this.instance.store;
  }

  public lock(){
    this._locked = true;
  }

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
