import { ipcRenderer } from "electron";
import EventEmitter from "eventemitter3";

export class Menu extends EventEmitter{

  constructor(){
    super();
    ipcRenderer.on('menu-click', (event, action) => this.onMenuClick(action));
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
  }

  private onMenuClick(action: string){
    this.emit('any', action);
    this.emit(action, { sender: this });
  }

  private onKeyDown(event: KeyboardEvent){
    if(event.ctrlKey){
      const action = this.getAction(event.key);
      if(action){
        this.onMenuClick(action);
      }
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

}
