export class Component{

  static idPointer: number = 1;

  readonly id: number;

  constructor(readonly type: ComponentType){
    this.id = Component.idPointer++;
  }

}

export enum ComponentType {
  Node = 'node-component',
  Edge = 'edge-component'
}
