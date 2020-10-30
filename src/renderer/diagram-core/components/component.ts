export class Component{

  static idPointer: number = 1;

  private _id: number;
  public get id(){
    return this._id;
  }

  constructor(readonly type: ComponentType){
    this._id = Component.idPointer++;
  }

  /**
   * Sets Component's id, It is used only in case of loading a project, Avoid using this method.
   * @param id The new ID
   */
  public _setId(id: number){
    this._id = id;
  }

}

export enum ComponentType {
  Node = 'node-component',
  Edge = 'edge-component',
  EdgeConnection = 'edge-connection-component',
}
