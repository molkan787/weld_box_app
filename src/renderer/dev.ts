import { remote } from "electron"

window.addEventListener('keydown', e => {
  if(e.key == 'F12'){
    remote.getCurrentWebContents().openDevTools();
  }
})
