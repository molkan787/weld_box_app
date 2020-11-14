import { Menu, MenuItem } from "electron";
import EventEmitter from "eventemitter3";

export class TopBarMenu extends EventEmitter{

  public menu: Menu | null = null;

  /**
   * Build the menu
   */
  buildMenu(){
    const menu = this.menu = new Menu();
    const click = (mi: MenuItem) => this.handleItemClick(mi);
    menu.insert(0, new MenuItem({
      label: 'File',
      submenu: [
        { id: 'open', label: 'Open', accelerator: 'CmdOrCtrl+O', click },
        { id: 'save', label: 'Save', accelerator: 'CmdOrCtrl+S', click },
        { id: 'save_as', label: 'Save as', accelerator: 'CmdOrCtrl+shift+S', click },
        { type: 'separator' },
        { id: 'properties', label: 'Properties', click, enabled: false },
        { type: 'separator' },
        { id: 'close', label: 'Close', click },
        { id: 'exit', label: 'Exit', click },
      ]
    }));

    menu.insert(1, new MenuItem({
      label: 'Edit',
      submenu: [
        { id: 'undo', label: 'Undo', accelerator: 'CmdOrCtrl+Z', click },
        { id: 'redo', label: 'Redo', accelerator: 'CmdOrCtrl+Y', click },
        { type: 'separator' },
        { id: 'copy', label: 'Copy', accelerator: 'CmdOrCtrl+C', click },
        { id: 'cut', label: 'Cut', accelerator: 'CmdOrCtrl+X', click },
        { id: 'paste', label: 'Paste', accelerator: 'CmdOrCtrl+V', click },
        { type: 'separator' },
        { id: 'comment', label: 'Comment', accelerator: 'CmdOrCtrl+,', click },
      ]
    }));

    menu.insert(2, new MenuItem({
      label: 'Tools',
      submenu: [
        { id: 'generate_code', label: 'Generate Code', click },
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

  /**
   * Enable or Disable a Menu item
   * @param itemId Item id
   * @param enabled `true` to enable the item, and `false` to disable the item
   */
  setItemEnable(itemId: string, enabled: boolean){
    const item = this.menu?.getMenuItemById(itemId);
    if(item){
      item.enabled = enabled;
    }
  }

  /**
   * Menu item click handler, This property should be re-assigned to use custom handler
   * @param menuItem The menu item that was clicked
   */
  handleItemClick(menuItem: MenuItem){
    console.log(`"${menuItem.label}" clicked!`)
  }

}
