import { EVENTS } from "../constants";
import { DiagramStore } from "../diagram-store";
import { addPoints, Side } from "../helpers/geometry";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { ZeroMargin } from "../interfaces/Margin";
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

  /** Parent node */
  private _parent: Node | null = null;
  /** Array of childs nodes */
  readonly children: Node[] = [];
  /** Edge Connections that are attached to this node */
  readonly edges: EdgeConnection[] = [];
  /** Indicates whether this node is basic. A basic node does not have header and body, instead is a simple square */
  readonly isBasic: boolean = false;
  /** Indicates whether this node is circular. A circular node renders as a simple circle */
  readonly isCircle: boolean = false;

  private _showContent: boolean = true;

  private _isSubChart: boolean = false;

  /** Indicates whether the node is highlighted or not */
  public highlighted: boolean = false;
  /** Indicates the highlighted wall of this node */
  public highlightedWall: Side | null = null;

  /** List of CSS/HTML classes that are appiled to the Node's DOM element */
  public readonly classes: string[];

  /** Name of the node */
  public name: string;

  public props: {
    /** Indicates whether the node is open or not */
    isOpen: boolean,
    /** Holds node's state when it is open */
    openState: {
      size?: Size,
      position?: Position
    },
    /** Holds node's state when it is not open */
    normalState: {
      size?: Size,
      position?: Position
    },
    /** Cached node's absolute position */
    absolutePosition?: Position
  } = { isOpen: false, openState: {}, normalState: {} };

  constructor(
    public position: Position,
    public size: Size,
    options?: NodeOptions
  ){
    super(ComponentType.Node);
    this.name = options?.name || '';
    const sc = options?.showContent;
    this._showContent = typeof sc == 'boolean' ? sc : true;
    if(options?.basic) this.isBasic = true;
    if(options?.circle) this.isCircle = true;
    this.classes = options?.classes || [];
  }

  /**
   * Indicate whether the Node is open or not
   */
  public get isOpen(){
    return this.props.isOpen;
  }

  public open(){
    this.store?.emit(EVENTS.DIAGRAM_OPEN_NODE, { node: this });
  }

  /**
   * Indicates whether node's content (body) is visible or not
   */
  public get showContent(){
    return this._showContent;
  }

  public set showContent(value: boolean){
    this.setShowContent(value);
  }

  /**
   * Shows or hides Node's content by passing a boolean value
   * @param {boolean} value `true` to show the content, `false` to hide it
   * @param {boolean} simulated set to `true` to bypass Undo/Redo system
   */
  public setShowContent(value: boolean, simulated?: boolean){
    const previous = this._showContent;
    this._showContent = value;
    if(previous !== value){
      this.store?.emit(EVENTS.NODE_ATTRS_CHANGED, { node: this, data: previous, simulated });
      const eventName = value ? EVENTS.NODE_CONTENT_GOT_SHOWN : EVENTS.NODE_CONTENT_GOT_HIDDEN;
      this.store?.emit(eventName, { node: this, simulated });
    }
  }

  /**
   * Indicate whether the Node is a Sub Chart or not
   */
  public get isSubChart(){
    return this._isSubChart;
  }

  /**
   * Convert the Node to a Sub Chart Node
   * @param {boolean} simulated set to `true` to bypass Undo/Redo system
   */
  public convertToSubChart(simulated?: boolean): boolean{
    if(this._isSubChart) return false;
    const event: DiagramEvent = { node: this };
    this.store?.emit(EVENTS.NODE_CONVERTING_TO_SUBCHART, event);
    if(event.prevented) return false;
    this._isSubChart = true;
    this.store?.emit(EVENTS.NODE_CONVERTED_TO_SUBCHART, { node: this, simulated });
    this.setShowContent(false, simulated);
    return true;
  }

  /**
   * Convert the Sub Chart Node to a normal Node
   * @param {boolean} simulated set to `true` to bypass Undo/Redo system
   */
  public convertToNormal(simulated?: boolean){
    if(!this._isSubChart) return;
    this._isSubChart = false;
    this.store?.emit(EVENTS.NODE_CONVERTED_TO_NORMAL, { node: this, simulated });
    this.setShowContent(true, simulated);
  }

  /**
   * Return the parent node, no matter if the calling node is open or not
   */
  public getParent(){
    return this._parent;
  }

  /**
   * Return the parent node only when the calling node is not open
   */
  public get parent(){
    return this.props.isOpen ? null : this._parent;
  }

  /**
   * Return the first Node in the hirechy going upward starting from this node
   * @param fallback This parameter can be ignored, it is used for internal functionality
   */
  public getTopParent(fallback: Node | null = null): Node | null{
    return this._parent?.getTopParent(this._parent) || fallback;
  }

  /**
   * Returns full hierarchical path from the top level parent down to this node
   * @param usePublicGetter if `true` the method will use the public getter of its parent for its operations, the diffrence is when a node is open its public parent getter will return `null` (check Node.parent() getter/property)
   */
  public getHierarchyPath(usePublicGetter: boolean = false): Node[]{
    const path: Node[] = [this];
    let n: Node | null = this;
    while(n = (usePublicGetter ? n.parent : n._parent)){
      path.push(n);
    }
    return path.reverse();
  }

  /**
   * Returns all descendents (This node, childs nodes and recursively all sub-childs).
   * This method its self doesn't use recursive calls, it use stack approach instead
   * @param skipHiddenNodes set to true to skip children of sub-chart's nodes, with exception of calling node's children
   */
  public getAllDescendentsNodes(skipSubChartChilds: boolean = false, skipDirectChildsAlso: boolean = false): Node[]{
    const allNodes: Node[] = [];
    const stack: Node[] = [this];
    while(stack.length > 0){
      const n = <Node>stack.shift();
      allNodes.push(n);
      if(!(skipSubChartChilds && !n.showContent && (n !== this || skipDirectChildsAlso))){
        stack.push(...n.children);
      }
    }
    return allNodes;
  }

  /**
   * Checks for given node's presence in childs hierarchy of this Node.
   * Returns `true` if found, otherwise returns `false`
   * @param node Node to check for its presence
   */
  public containsNode(node: Node): boolean{
    const hirearchy = node.getHierarchyPath();
    for(let i = 0; i < hirearchy.length; i++){
      if(hirearchy[i] === this){
        return true;
      }
    }
    return false;
  }

  /**
   * Adds child node, of the child node is newly created, in addition to calling this method, Diagram.addNode(child) should be also called
   * @param child
   */
  addChild(child: Node){
    const exist = this.children.includes(child);
    if(!exist){
      this.children.push(child);
    }
    child._parent = this;
  }

  /** Removes child node */
  removeChild(child: Node){
    const index = this.children.indexOf(child);
    if(index >= 0){
      this.children.splice(index, 1);
    }
    child._parent = null;
  }

  /**
   * Create a new `EdgeConnection` instance and link it to the current `Node` instance
   * @param wall Wall of node to which attach the created EdgeConnection
   */
  createEdgeConnection(wall?: Side){
    const connection = typeof wall === 'undefined'
                        ? new EdgeConnection(AttachType.NodeBody)
                        : new EdgeConnection(AttachType.NodeWall, wall);
    connection.node = this;
    this.edges.push(connection);
    return connection;
  }

  /**
   * Add an exiting edge connection to this node,
   * calling this method isn't enough to make the edgeConenction fully connected to this node, you to also specify the correct attach type on the EdgeConnection itself
   * @param connection The EdgeConnection instance to be added
   * @param skipNodeSetting if `true` this node won't be assigned to the EdgeConnection as the attached node
   */
  addEdgeConnection(connection: EdgeConnection, skipNodeSetting?: boolean){
    const index = this.edges.indexOf(connection);
    if(index == -1){
      this.edges.push(connection);
    }
    !skipNodeSetting && (connection.node = this);
  }

  /**
   * Unlink an edge connection and remove it from the node instance
   * @param connection EdgeConnection instance that need to be removed
   */
  removeEdgeConnection(connection: EdgeConnection, skipNodeSetting?: boolean): boolean{
    if(connection.node !== this){
      throw new Error(`Requested removal of Edge Connection from an incorrect Node`);
    }
    !skipNodeSetting && (connection.node = null);
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
  public getAbsolutePosition(useCachedPosition: boolean = false): Position{
    if(useCachedPosition && this.props.absolutePosition) return this.props.absolutePosition;
    const pad = this.store?.nodePadding || ZeroMargin;
    let result = null;
    if(this.parent != null){
      const pp = this.parent.getAbsolutePosition();
      const ap = addPoints(pp, this.position);
      ap.x += pad.left;
      ap.y += pad.top;
      result = ap;
    }else{
      result = this.position;
    }
    this.props.absolutePosition = result;
    return result;
  }

  /**
   * Selects the node in Diagram's canvas
   */
  public select(){
    this.store?.emit(EVENTS.NODE_SELECTED, { node: this });
  }

  /**
   * A life cycle hook, called after initial build of DOM element of the node.
   * Can be used to add custom content
   * @param d3node D3's selection of node's DOM element
   */
  public DOMElementBuilt(d3node: D3Node){}

  /**
   * A life cycle hook, called before destroying DOM element of the node.
   * Can be used to clean up custom content
   * @param d3node D3's selection of node's DOM element
   */
  public BeforeDOMElementDestroy(d3node: D3Node){}

}

/**
 * Node constructor options
 */
export interface NodeOptions{
  name?: string;
  showContent?: boolean;
  basic?: boolean;
  circle?: boolean;
  classes?: string[];
}
