import { ipcRenderer } from "electron";
import EventEmitter from "eventemitter3";
import { USE_NATIVE_CLIPBOARD } from "../symbols";

const PROJECT_ITEMS = [
  'save_as', 'close', 'copy', 'paste', 'cut', 'comment', 'generate_code'
];

class MenuClass extends EventEmitter{

  constructor(){
    super();
    this.disableProjectItems();
    ipcRenderer.on('menu-click', (event, action) => this.onMenuClick(action));
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
  }

  public disableProjectItems(){
    this.setItemsEnable(PROJECT_ITEMS.concat('save', 'undo', 'redo'), false);
  }

  public enableProjectItems(skipVariableItems?: boolean){
    const items = skipVariableItems ? PROJECT_ITEMS : PROJECT_ITEMS.concat('save', 'undo', 'redo');
    this.setItemsEnable(items, true);
  }

  public setItemsEnable(itemsIds: string[], enabled: boolean){
    itemsIds.map(itemId => this.setItemEnable(itemId, enabled));
  }

  public setItemEnable(itemId: string, enabled: boolean){
    ipcRenderer.send('set-menu-item-enable', itemId, enabled);
  }

  private onMenuClick(action: string){
    this.emit('any', action);
    this.emit(action, { sender: this });
  }

  private onKeyDown(event: KeyboardEvent){
    if(event.ctrlKey){
      const action = this.getAction(event.key);
      if(action){
        if(!this.shouldHandleEvent(event, action)) return;
        event.preventDefault();
        this.onMenuClick(action);
      }
    }else if(event.key === 'Delete'){
      this.onMenuClick('delete');
    }
  }

  private getAction(key: string){
    switch (key) {
      case 'z':
        return 'undo';
      case 'y':
        return 'redo';
      case 'c':
      case 'C':
        return 'copy';
      case 'x':
      case 'X':
        return 'cut';
      case 'v':
      case 'V':
        return 'paste';

      default:
        return null;
    }
  }

  private shouldHandleEvent(event: KeyboardEvent, action: string): boolean{
    const target = event.target;
    if(target && ['copy', 'cut', 'paste'].includes(action)){
      const path = <HTMLElement[]>(<any>event).path
      if(path instanceof Array){
        for(let i = 0; i < path.length; i++){
          const el = path[i];
          if(el.tagName == 'BODY') break;
          if(el.getAttribute(USE_NATIVE_CLIPBOARD)){
            return false;
          }
        }
      }
    }
    return true;
  }

}

/**
 * Emits application menu click (or shortcuts press) events
 */
export const Menu = new MenuClass();
