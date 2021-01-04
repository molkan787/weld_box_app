export class StatusController{

  /**
   * Sets the text of the application's status bar
   * @param text The text to display (if `null` it will replace by 'Idle')
   */
  static setStatusText(text: string | null){
    (<HTMLElement>document.getElementById('status-text')).innerText = text || 'Idle';
  }

}

window.addEventListener('load', () => StatusController.setStatusText('Idle'));
