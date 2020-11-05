export class Dialog{

  private static _ask: (text: string, options?: any) => Promise<boolean | string>;
  private static _info: (text: string, options?: any) => Promise<boolean | string>;

  public static ask(text: string, options?: any){
    return this._ask(text, options);
  }

  public static info(text: string, options?: any){
    return this._info(text, options);
  }

  public static error(text: string, options?: any){
    this.info(text, {
      title: 'Error',
      ...options
    })
  }

}
