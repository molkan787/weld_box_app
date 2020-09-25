import { Side } from "../helpers/geometry";
import { Position } from "../interfaces/Position";
import { Size } from "../interfaces/Size";
import { Component, ComponentType } from "./component";
import { AttachType, EdgeConnection } from "./edge-connection";

/**
 * `Node` class holds all properties of diagram's node
 * This class should be extended for use of business logic properties/attributes
 */
export class Node extends Component{

  private _parent: Node | null = null;
  readonly children: Node[] = [];
  readonly edges: EdgeConnection[] = [];

  public highlighted: boolean = false;
  public highlightedWall: Side | null = null;

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

  createEdgeConnection(wall?: Side){
    const connection = typeof wall === 'undefined'
                        ? new EdgeConnection(AttachType.Node)
                        : new EdgeConnection(AttachType.NodeWall, wall);
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
