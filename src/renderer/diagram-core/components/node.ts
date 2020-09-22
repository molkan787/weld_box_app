import { Position } from "../interfaces/Position";
import { Size } from "../interfaces/Size";
import { Component, ComponentType } from "./component";
import { AttachType, EdgeConnection } from "./edge-connection";

export class Node extends Component{

  private _parent: Node | null = null;
  readonly children: Node[] = [];
  readonly edges: EdgeConnection[] = [];

  public highlighted: boolean = false;

  constructor(
    public position: Position,
    public size: Size
  ){
    super(ComponentType.Node);
  }

  public get parent(){
    return this._parent;
  }

  addChild(child: Node){
    const exist = this.children.includes(child);
    if(!exist){
      this.children.push(child);
    }
    child._parent = this;
  }

  removeChild(child: Node){
    const index = this.children.indexOf(child);
    if(index >= 0){
      this.children.splice(index, 1);
    }
    child._parent = null;
  }

  createEdgeConnection(){
    const connection = new EdgeConnection(AttachType.Node);
    connection.node = this;
    this.edges.push(connection);
    return connection;
  }

  removeEdgeConnection(connection: EdgeConnection): boolean{
    if(connection.node !== this){
      throw new Error(`Requested removal of Edge Connection from an incorrect Node`);
    }
    connection.node = null;
    const index = this.edges.indexOf(connection);
    if(index >= 0){
      this.edges.splice(index, 1);
      return true;
    }
    return false;
  }

}
