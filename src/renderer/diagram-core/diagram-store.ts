import { D3Node, D3NodesMap } from "./types/aliases";
import RBush, { BBox } from 'rbush';
import EventEmitter from 'eventemitter3';
import { Node } from "./components/node";
import { Position } from "./interfaces/Position";
import { CLASSES, EVENTS, MODULES } from "./constants";
import { DiagramEvent } from "./interfaces/DiagramEvent";
import { ZoomTransform } from "d3";
import { DiagramOptions } from "./interfaces/DiagramOptions";
import { Margin } from "./interfaces/Margin";
import { Edge } from "./components/edge";
import { Component } from "./components/component";
import { DiagramModule } from "./module";
import { ActionsArchiver } from "./modules/actions-archiver";
import { StateSnaper } from "./modules/sub-modules/state-snaper";
import { EdgeConnection } from "./components/edge-connection";
import { EdgeFactory } from "./interfaces/EdgeInstanceCreator";

/**
 * `DiagramStore` acts as a Central State Store and an Event Bus for all diagram's modules
 */
export class DiagramStore extends EventEmitter{

  /**
   * List of all nodes added to the Diagram
   */
  public readonly nodes: Node[] = [];

  /**
   * A map of all edges added to the diagram, stores as edge.id => edge
   */
  public readonly edgesMap: Map<number, Edge> = new Map();

  /**
   * Holds the currently selected Diagram Component
   */
  public selectedComponent: Component | null = null;

  /**
   * Actions Archiver instance of the diagram
   */
  public readonly actionsArchiver: ActionsArchiver = new ActionsArchiver(this);

  /**
   * State Snaper instance
   */
  public readonly stateSnaper: StateSnaper = new StateSnaper();

  private _currentlyOpenNode: Node | null = null;
  /**
   * Access the Node that is currently open as a sub-chart
   */
  public get currentlyOpenNode(){
    return this._currentlyOpenNode;
  }
  public setCurrentlyOpenNode(node: Node | null){
    this._currentlyOpenNode = node;
  }

  /**
   * A map to store Actual DOM/SVG elements by Node's id,
   */
  public readonly d3NodesMap: D3NodesMap = new Map<number, D3Node>();

  /** A map to store Nodes in spacial grid to facilitate finding nodes by a 2D point in the canvas */
  public nodesSpatialMap: MyRBush = new MyRBush();

  /**
   * Stack container diagram modules activation history
   */
  public modulesStack: DiagramModule[] = [];

  /**
   * Holds the current active diagram module
   */
  public activeModule: DiagramModule | null = null;

  /** Holds canvas zoom & drag transform */
  private _zoomTransform: ZoomTransform | null = null;

  /**
   * Holds canvas offset relative to the top left corner of the web page.
   * Correctness of this value is important for a correct user interaction
  */
  private _canvasOffset: Position = { x: 0, y: 0 };

  /**
   * Holds the root element (d3 selection of dom element)
   */
  private _rootElement: D3Node | null = null;

  /**
   * Node padding values used for calculate aboslute position of an object,
   * The values should have same values as in css, its also should count the borders width,
   * ex: if in css there is a `border-width: 3px` this padding should be { top: 3, right: 0, bottom: 0, left: 0 }
   */
  public readonly nodePadding: Margin;

  /** Normaly recursive updates are slightly delayed (asynchronouse), setting this property to `true` will force synchronous update (without delays) */
  public forceSynchronousUpdates: boolean = false;

  /**
   * The EdgeFactory passed in the options when constructing the Diagram class instance
   */
  private _edgeFactory: EdgeFactory;
  public get edgeFactory(){
    return this._edgeFactory;
  }

  constructor(public readonly diagramOptions: DiagramOptions){
    super();
    this._edgeFactory = diagramOptions.edgeFactory
                      || ((s: EdgeConnection, t: EdgeConnection) => new Edge(s, t));

    const { nodeBorderWidth, nodeHeaderHeight } = diagramOptions;

    this.nodePadding = Object.freeze({
      top: nodeHeaderHeight + nodeBorderWidth - 1,
      right: nodeBorderWidth,
      bottom: nodeBorderWidth,
      left: nodeBorderWidth
    })

    // Updates Node's spatial index each time was dropped
    this.on(EVENTS.NODE_DROPPED, ({ node }: DiagramEvent) => this.refreshNode(<Node>node))
  }

  /**
   * Returns the zoom transform (scale and offset translate) of the canvas
   */
  public get zoomTransform(){
    return this._zoomTransform;
  }

  /**
   * Cache the zoom transform (scale and offset translate) of the canvas,
   * And emits it change event
   */
  public setZoomTransform(transform: ZoomTransform | null){
    this._zoomTransform = transform;
    this.emit(EVENTS.DIAGRAM_ZOOM_CHANGED, {});
  }

  /**
   * Returns canvas offset from the top left corner of the page (inner part of the window)
   */
  public get canvasOffset(){
    return this._canvasOffset;
  }

  /**
   * Store canvas offset from the top left corner of the page (inner part of the window) for later access using `canvasOffset`
   */
  public setCanvasOffset(offset: Position){
    this._canvasOffset = offset;
  }

  /**
   * Return the root DOM element of the canvas
   */
  public get rootElement(){
    return <D3Node>this._rootElement;
  }

  /**
   * Stpre the root DOM element of the canvas for later access using `rootElement`
   */
  public setRootElement(element: D3Node){
    if(this._rootElement != null){
      throw new Error('setRootElement() can be called only once and at initialization')
    }
    this._rootElement = element;
    this.emit(EVENTS.INIT_CANVAS_CREATED, {});
  }

  /**
   * Pushes the currently active module to the stack and sets the passed module as the active one
   * @param module The module to be activated
   */
  public activateModule(module: DiagramModule){
    if(module === this.activeModule) return;
    if(this.activeModule){
      this.modulesStack.push(this.activeModule);
    }
    this.setActiveModule(module);
    this.emitActiveModuleChanged();
  }

  /**
   * Unsets the passed module as the active module, than pop another from the stack and sets it as the active one
   * @param module The module to be deactivated
   */
  public deactiveModule(module: DiagramModule){
    if(module !== this.activeModule) return;
    if(this.modulesStack.length > 0){
      this.setActiveModule(<DiagramModule>this.modulesStack.pop());
    }else{
      this.setActiveModule(null);
    }
    this.emitActiveModuleChanged();
  }

  /** Store the active module reference */
  private setActiveModule(module: DiagramModule | null){
    this.activeModule = module;
    const isEdgeDrawer = module?.name == MODULES.EDGE_DRAWER;
    this.rootElement?.classed(CLASSES.EDGE_DRAWER_ACTIVE, isEdgeDrawer);
  }

  /**
   * Emits an event whenever a module requests activation or deactivation of its self
   */
  private emitActiveModuleChanged(){
    this.emit(EVENTS.DIAGRAM_ACTIVE_MODULE_CHANGED, { data: this.activeModule });
  }

  /**
   * Gets D3Node from hash-table/map by Id
   * @param id Id of the Node
   */
  public getD3Node(id: number, failGently: boolean = false){
    const n = this.d3NodesMap.get(id);
    if(!failGently && typeof n === 'undefined'){
      throw new Error(`Node #${id} was not found in D3NodesMap`);
    }
    return <D3Node>n;
  }

  /**
   * Adds the passed Edge instance to the indecies
   * @param edge The Edge instance to be added
   */
  public addEdge(edge: Edge){
    if(this.edgesMap.get(edge.id) instanceof Edge)
      return false;

    this.edgesMap.set(edge.id, edge);
    return true;
  }

  /**
   * Gets the Edge instance from hash-table/map by Id
   * @param id The id of the Edge
   */
  public getEdgeById(id: number){
    return this.edgesMap.get(id) || null;
  }

  /**
   * Store a `D3Node` in a hash table by the Node's Id
   * @param id Id of the Node
   * @param d3Node A `D3Node` instance to be stored and referenced
   */
  public setD3Node(id: number, d3Node: D3Node): void{
      this.d3NodesMap.set(id, d3Node);
  }

  /**
   * Add a Node to diagram's indices store.
   * @param node The Node to be stored
   */
  public addNode(node: Node): boolean{
    if(this.nodes.indexOf(node) >= 0) return false;
    this.nodes.push(node);
    this.nodesSpatialMap.insert(node);
    return true;
  }

  /**
   * Remove Node from diagram's indices store.
   * All `Node`s that was removed from the Diagram and/or was destroyed,
   * Need to be also removed from indices
   * @param node The `Node` instance to be removed
   */
  public removeNode(node: Node): void{
    const idx = this.nodes.indexOf(node);
    this.nodes.splice(idx, 1);
    this.nodesSpatialMap.remove(node);
  }

  /**
   * Refresh Node's index in the Spatial Map/Index
   * @param node The `Node` instance to be refreshed
   */
  public refreshNode(node: Node){
    this.removeNode(node);
    this.addNode(node);
  }

  /**
   * Return all top level Nodes (Nodes that does not have a parent, sort of direct childs of the diagram)
   */
  public getTopLevelNodes(){
    const nodes = this.nodes;
    const len = nodes.length;
    const topLevelNodes: Node[] = [];
    for(let i = 0; i < len; i++){
      const node = nodes[i];
      if(node.getParent() == null && node.isSubChart){
        topLevelNodes.push(node);
      }
    }
    return topLevelNodes;
  }

  /**
   * Searches for and return nodes that overlaps with a point or bounding box (can be specified using `radius` parameter)
   * @param point 2D Point thats specify where to search for nodes
   * @param radius Number of pixels to enlarge the target bouding box (ex: a radius of 2 gives a box of 4x4)
   */
  public getNodesFromPoint(point: Position, radius: number = 1): Node[]{
    // Converts Point to Bounding Box
    const bbox = this.pointToBBox(point, radius);

    // Run the actual search on the Spatial Map/Index
    return this.nodesSpatialMap.search(bbox);
  }

  public getNodesFromBBox(bbox: BBox): Node[]{
    // Run the actual search on the Spatial Map/Index
    return this.nodesSpatialMap.search(bbox);
  }

  /** Converts Point to `RBush`s Bounding Box */
  private pointToBBox(point: Position, radius: number){
    const { x, y } = point;
    return {
      minX: x - radius,
      minY: y - radius,
      maxX: x + radius,
      maxY: y + radius
    }
  }

  /**
   * Maps client point (relative to top left corner of the web page) to the canvas point.
   * Basically adds offset and scales the point accoding to the canvas zoom level and drag position,
   * also adds the offset of the canvas wrapper relative the the web page
   * @param point Point to be mapped
   * @param roundNumbers if `true` the returned x, y will be rounded to the nearest integers
   */
  public transformClientPoint(point: Position, roundNumbers: boolean = false): Position{
    let { x, y } = point;
    x -= this.canvasOffset.x;
    y -= this.canvasOffset.y;
    return this.transformPoint({ x, y }, roundNumbers);
  }

  /**
   * Maps point (relative to top left corner of diagram's root element) to the canvas point.
   * Basically adds offset and scales the point accoding to the canvas zoom level and drag position
   * @param point Point to be mapped
   * @param roundNumbers if `true` the returned x, y will be rounded to the nearest integers
   */
  public transformPoint(point: Position, roundNumbers: boolean = false): Position{
    let { x, y } = point;
    if(this.zoomTransform){
      // scale and move the point according to the canvas zoom level and drag offset
      [x, y] = this.zoomTransform.invert([x, y]);
    }
    if(roundNumbers){
      return {
        x: Math.round(x),
        y: Math.round(y)
      };
    }else{
      return { x, y };
    }
  }

  /**
   * Emits an event
   * @param type Event's type name
   * @param event Event's data
   */
  // this method is overwriten to force the use of `DiagramEvent` interface as event data object
  // @ts-ignore
  emit(type: string, event: DiagramEvent){
    event.type = type;
    super.emit(type, event);
  }

}

/**
 * `MyRBush` extends `RBush` to customize data format
 */
export class MyRBush extends RBush<Node>{

  constructor(){
    super();
  }

  /**
   * Converts Node's size and position to a Bounding box
   * @param node
   */
  toBBox(node: Node){
    const s = node.size;
    const p = node.getAbsolutePosition(true);
    return {
      minX: p.x,
      minY: p.y,
      maxX: p.x + s.width,
      maxY: p.y + s.height
    }
  }

  compareMinX(a: Node, b: Node){
    const ap = a.getAbsolutePosition(true);
    const bp = b.getAbsolutePosition(true);
    return ap.x - bp.x;
  }

  compareMinY(a: Node, b: Node){
    const ap = a.getAbsolutePosition(true);
    const bp = b.getAbsolutePosition(true);
    return ap.y - bp.y;
  }


}
