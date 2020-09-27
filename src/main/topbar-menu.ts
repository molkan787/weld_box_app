import { Menu, MenuItem } from "electron";
import EventEmitter from "eventemitter3";

export class TopBarMenu extends EventEmitter{

  buildMenu(){
    const menu = new Menu();
    const click = (mi: MenuItem) => this.handleItemClick(mi);
    menu.insert(0, new MenuItem({
      label: 'File',
      submenu: [
        { label: 'Open', accelerator: 'CmdOrCtrl+O', click },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click },
        { label: 'Save as', accelerator: 'CmdOrCtrl+shift+S', click },
        { type: 'separator' },
        { label: 'Properties', click, enabled: false },
        { type: 'separator' },
        { label: 'Close', click },
        { label: 'Exit', click },
      ]
    }));

    menu.insert(1, new MenuItem({
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Y', click },
        { type: 'separator' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', click },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', click },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', click },
        { type: 'separator' },
        { label: 'Comment', accelerator: 'CmdOrCtrl+,', click },
      ]
    }));

    menu.insert(2, new MenuItem({
      label: 'Tools',
      submenu: [
        { label: 'Generate Code', click },
      ]
    }));

    menu.insert(3, new MenuItem({
      label: 'Help',
      submenu: [
        { label: 'Terms of use', click },
        { label: 'About', click },
      ]
    }));

    return menu;
  }

  handleItemClick(menuItem: MenuItem){
    console.log(`"${menuItem.label}" clicked!`)
  }

}
