export class StatusController{

  static setStatusText(text: string | null){
    (<HTMLElement>document.getElementById('status-text')).innerText = text || 'Idle';
  }

}

window.addEventListener('load', () => StatusController.setStatusText('Idle'));
