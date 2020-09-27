import { D3Node, D3NodesMap } from "./types/aliases";
import RBush from 'rbush';
import EventEmitter from 'eventemitter3';
import { Node } from "./components/node";
import { Position } from "./interfaces/Position";
import { EVENTS } from "./constants";
import { DiagramEvent } from "./interfaces/DiagramEvent";

/**
 * `DiagramStore` acts as a Central State Store and an Event Bus for all diagram's modules
 */
export class DiagramStore extends EventEmitter{

  /** A map to store Actual DOM/SVG elements by Node's id,
   * where `Node` is a class holding diagram node properties */
  private readonly d3NodesMap: D3NodesMap = new Map<number, D3Node>();

  /** A map to store Nodes in spacial grid to facilitate Node finding by a 2D point in the canvas */
  private readonly nodesSpatialMap: MyRBush = new MyRBush();

  public nodeDraggingTool: boolean = true;


  constructor(){
    super();
    // Updates Node's spatial index each time was dropped
    this.on(EVENTS.NODE_DROPPED, ({ node }: DiagramEvent) => this.refreshNode(<Node>node))
  }

  /**
   * Gets D3Node from hash table by Id
   * @param id Id of the Node
   */
  public getD3Node(id: number){
    const n = this.d3NodesMap.get(id);
    if(typeof n === 'undefined'){
      throw new Error(`Node #${id} was not found in D3NodesMap`);
    }
    return <D3Node>n;
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
   * Add a Node to the Spatial Map.
   * Only first level nodes (not child nodes) should be added to this Spatial Map
   * @param node A Node to be stored
   */
  public addNode(node: Node): void{
    this.nodesSpatialMap.insert(node);
  }

  /**
   * Remove Node from the Spatial Map.
   * All `Node`s that was removed from the Diagram and/or was destroyed,
   * Need to be also removed from this Spatial Map
   * @param node The `Node` instance to be removed
   */
  public removeNode(node: Node): void{
    this.nodesSpatialMap.remove(node);
  }

  /**
   * Refresh Node's index in the Spatial Map/Index
   * @param node The `Node` instance to be refreshed
   */
  public refreshNode(node: Node){
    this.removeNode(node);
    if(node.parent) return;
    this.addNode(node);
  }

  /**
   * Searches for and return nodes that are the specified 2D Point
   * @param point 2D Point thats specify where to search for nodes
   */
  public getNodesFromPoint(point: Position): Node[]{
    // Converts Point to Bounding Box
    const bbox = this.pointToBBox(point);

    // Run the actual search on the Spatial Map/Index
    return this.nodesSpatialMap.search(bbox);
  }

  /** Converts Point to `RBush`s Bounding Box */
  private pointToBBox(point: Position){
    const { x, y } = point;
    return {
      minX: x - 1,
      minY: y - 1,
      maxX: x + 1,
      maxY: y + 1
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
class MyRBush extends RBush<Node>{

  toBBox(node: Node){
    const { position: p, size: s } = node;
    return {
      minX: p.x,
      minY: p.y,
      maxX: p.x + s.width,
      maxY: p.y + s.height
    }
  }

  compareMinX(a: Node, b: Node){
    return a.position.x - b.position.x;
  }

  compareMinY(a: Node, b: Node){
    return a.position.y - b.position.y;
  }


}
