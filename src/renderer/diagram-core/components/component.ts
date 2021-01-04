export class Component{

  /**
   * A static integer pointer, used for assigning a unique id for each of Diagram's component
   */
  static idPointer: number = 1;

  /**
   * Returns the current id pointer value, and increment it (so each time the return value is diffrent)
   */
  static genId(){
    return this.idPointer++;
  }

  private _id: number;

  /**
   * Unique component id
   */
  public get id(){
    return this._id;
  }

  /**
   *
   * @param type Component's type
   */
  constructor(readonly type: ComponentType){
    this._id = Component.genId();
  }

  /**
   * Sets Component's id, It is used only in case of loading a project, Avoid using this method in other cases
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
