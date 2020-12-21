import { ipcRenderer } from "electron";
import EventEmitter from "eventemitter3";
import { USE_NATIVE_CLIPBOARD } from "../symbols";

const PROJECT_ITEMS = [
  'save_as', 'close', 'copy', 'paste', 'cut', 'comment', 'generate_code'
];

/**
 * This module controls the application menu
 */
class MenuClass extends EventEmitter{

  constructor(){
    super();
    this.disableProjectItems();
    ipcRenderer.on('menu-click', (event, action) => this.onMenuClick(action));
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
  }

  /**
   * Disables menu items that are specific to the project
   */
  public disableProjectItems(){
    this.setItemsEnable(PROJECT_ITEMS.concat('save', 'undo', 'redo'), false);
  }

  /**
   * Enables menu items that are specific to the project
   * @param skipVariableItems if `true` skip enable items that even they are specific to the project, they aren't allways available (ex: save item is available only after user make changes)
   */
  public enableProjectItems(skipVariableItems?: boolean){
    const items = skipVariableItems ? PROJECT_ITEMS : PROJECT_ITEMS.concat('save', 'undo', 'redo');
    this.setItemsEnable(items, true);
  }

  /**
   * Enable or disable the specified list of items
   * @param itemsIds List of items to toggle
   * @param enabled `true` to enable, `false` to disable
   */
  public setItemsEnable(itemsIds: string[], enabled: boolean){
    itemsIds.map(itemId => this.setItemEnable(itemId, enabled));
  }

  /**
   *
   * @param itemId Enable or disable the specified item
   * @param enabled `true` to enable, `false` to disable
   */
  public setItemEnable(itemId: string, enabled: boolean){
    ipcRenderer.send('set-menu-item-enable', itemId, enabled);
  }

  /**
   * Handles menu item click to re-emit the event in the internal events bus
   * @param action
   */
  private onMenuClick(action: string){
    this.emit('any', action);
    this.emit(action, { sender: this });
  }

  /**
   * Handles keydown event, to simulate clicks of menu items (some items even they have shortcut, when they are not triggered by key presses)
   * @param event
   */
  private onKeyDown(event: KeyboardEvent){
    const action = this.getAction(event.key);
    if(action){
      if(!this.shouldHandleEvent(event, action)) return;
      event.preventDefault();
      this.onMenuClick(action);
    }
  }

  /**
   * Returns the associated action to a keyboard key
   * @param key
   */
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
      case 'Delete':
        return 'delete';

      default:
        return null;
    }
  }

  /**
   * Decide if the action should be handler or not,
   * ex: an input element with attribute `USE_NATIVE_CLIPBOARD` indicate that copy, paste, cut should be hanlder by the native system, hence the action will not be handler by this module
   * @param event
   * @param action
   */
  private shouldHandleEvent(event: KeyboardEvent, action: string): boolean{
    const target = event.target;
    if(target && ['copy', 'cut', 'paste', 'delete'].includes(action)){
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
