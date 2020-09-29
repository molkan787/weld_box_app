export class StatusController{

  static setStatusText(text: string){
    (<HTMLElement>document.getElementById('status-text')).innerText = text;
  }

}

window.addEventListener('load', () => StatusController.setStatusText('Idle'));
