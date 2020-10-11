import { EVENTS } from "../constants";
import { DiagramStore, MyRBush } from "../diagram-store";
import { addPoints, Side } from "../helpers/geometry";
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

  public store?: DiagramStore;

  private _parent: Node | null = null;
  readonly children: Node[] = [];
  readonly edges: EdgeConnection[] = [];

  private _showContent: boolean = true;

  public highlighted: boolean = false;
  public highlightedWall: Side | null = null;

  public title: string;

  public readonly props: {
    isOpen: boolean,
    openState: {
      size?: Size,
      position?: Position
    },
    normalState: {
      size?: Size,
      position?: Position
    }
  } = { isOpen: false, openState: {}, normalState: {} };

  constructor(
    public position: Position,
    public size: Size,
    options?: any
  ){
    super(ComponentType.Node);
    this.title = options?.title || '';
    const sc = options?.showContent;
    this._showContent = typeof sc == 'boolean' ? sc : true;
  }

  public open(){
    this.store?.emit(EVENTS.DIAGRAM_OPEN_NODE, { node: this });
  }

  public get showContent(){
    return this._showContent;
  }

  public set showContent(value: boolean){
    const previous = this._showContent;
    this._showContent = value;
    this.store?.emit(EVENTS.NODE_ATTRS_CHANGED, { node: this });
    if(previous !== value){
      const eventName = value ? EVENTS.NODE_CONTENT_GOT_SHOWN : EVENTS.NODE_CONTENT_GOT_HIDDEN;
      this.store?.emit(eventName, { node: this });
    }
  }

  public get parent(){
    return this.props.isOpen ? null : this._parent;
  }

  /**
   * Return the first Node in the hirechy going upward starting the current node
   * @param fallback This parameter can be ignored, it is used for internal functionality
   */
  public getTopParent(fallback: Node | null = null): Node | null{
    return this._parent?.getTopParent(this._parent) || fallback;
  }

  public getHierarchyPath(): Node[]{
    const path: Node[] = [this];
    let n: Node | null = this;
    while(n = n.parent){
      path.push(n);
    }
    return path.reverse();
  }

  /**
   * Returns all descendents (This node, childs nodes and recursively all sub-childs).
   * This method its self doesn't use recursive calls, instead stack approach
   * @param skipHiddenNodes set to true to skip children of nodes with hidden content (`Node.showContent == false`)
   */
  public getAllDescendentsNodes(skipHiddenNodes: boolean = false): Node[]{
    const allNodes: Node[] = [];
    const stack: Node[] = [this];
    while(stack.length > 0){
      const n = <Node>stack.shift();
      allNodes.push(n);
      if(!(skipHiddenNodes && !n.showContent)){
        stack.push(...n.children);
      }
    }
    return allNodes;
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
   * Calculates & return Node's absolute position with respect of parent's absolute position and padding
   */
  public getAbsolutePosition(): Position{
    const pad = (<DiagramStore>this.store).nodePadding;
    if(this.parent != null){
      const pp = this.parent.getAbsolutePosition();
      const ap = addPoints(pp, this.position);
      ap.x += pad.left;
      ap.y += pad.top;
      return ap;
    }else{
      return this.position;
    }
  }

  /**
   * A life cycle hook, called after initial build of DOM element of the node.
   * Can be used to add custom content
   * @param d3node D3's selection of node's DOM element
   */
  public DOMElementBuilt(d3node: D3Node){}

}
