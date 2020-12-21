export class Dialog{

  private static _ask: (text: string, options?: any) => Promise<boolean | string>;
  private static _info: (text: string, options?: any) => Promise<boolean | string>;

  /**
   * Prompts the user using dialog box to answer a question
   * @param text The question text
   * @param options See `components/Dialog.vue`
   */
  public static ask(text: string, options?: any){
    return this._ask(text, options);
  }

  /**
   * Display a message to the user
   * @param text the message
   * @param options  See `components/Dialog.vue`
   */
  public static info(text: string, options?: any){
    return this._info(text, options);
  }

  /**
   * Display a message titled 'Error' to the user
   * @param text The message
   * @param options  See `components/Dialog.vue`
   */
  public static error(text: string, options?: any){
    this.info(text, {
      title: 'Error',
      ...options
    })
  }

}
