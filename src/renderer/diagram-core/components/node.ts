import { Position } from "../interfaces/Position";
import { Size } from "../interfaces/Size";
import { Component, ComponentType } from "./component";
import { AttachType, EdgeConnection } from "./edge-connection";

export class Node extends Component{

  readonly children: Node[] = [];
  readonly edges: EdgeConnection[] = [];

  constructor(
    public position: Position,
    public size: Size
  ){
    super(ComponentType.Node);
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
    const index = this.edges.indexOf(connection);
    if(index >= 0){
      this.edges.splice(index, 1);
      return true;
    }
    return false;
  }

}
