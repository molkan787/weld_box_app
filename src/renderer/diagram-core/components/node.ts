import { Side } from "../helpers/geometry";
import { Position } from "../interfaces/Position";
import { Size } from "../interfaces/Size";
import { D3Node } from "../types/aliases";
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

  public title: string;

  constructor(
    public position: Position,
    public size: Size,
    data?: any
  ){
    super(ComponentType.Node);
    this.title = data?.title || '';
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

  /**
   * Create a new `EdgeConnection` instance and link it to the current `Node` instance
   * @param wall
   */
  createEdgeConnection(wall?: Side){
    const connection = typeof wall === 'undefined'
                        ? new EdgeConnection(AttachType.Node)
                        : new EdgeConnection(AttachType.NodeWall, wall);
    connection.node = this;
    this.edges.push(connection);
    return connection;
  }

  /**
   * Unlink an edge connection and remove it from the node instance
   * @param connection EdgeConnection instance that need to be removed
   */
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

  /**
   * A life cycle hook, called after initial build of DOM element of the node.
   * Can be used to add custom content
   * @param d3node D3's selection of node's DOM element
   */
  public DOMElementBuilt(d3node: D3Node){}

}
