import { zoomIdentity, ZoomTransform } from "d3";
import { Node } from "../components/node";
import { EVENTS } from "../constants";
import { DiagramStore, MyRBush } from "../diagram-store";
import { DiagramEvent } from '../interfaces/DiagramEvent';
import { cloneObject } from "../utils";

/**
 * Handles the process of opening a node as sub-chart (displaying a node and its childs on the canvas)
 */
export class SubChart{

  public readonly zoomTransforms: Map<number, ZoomTransform> = new Map();
  private readonly stack: ChartItem[] = [];

  private _currentNode: Node | null = null;
  public get currentNode(){
    return this._currentNode;
  }
  public set currentNode(node: Node | null){
    this._currentNode = node;
    this.store.setCurrentlyOpenNode(node);
  }

  constructor(public store: DiagramStore){
    store.on(EVENTS.DIAGRAM_OPEN_NODE, ({node}: DiagramEvent) => this.jumpTo(<Node>node));
    store.on(EVENTS.DIAGRAM_JUMP_TO_NODE, ({node}: DiagramEvent) => this.jumpTo(<Node | null>node));
    store.on(EVENTS.DIAGRAM_ZOOM_CHANGED, () => this.onZoomChanged());
    store.on(EVENTS.NODE_DOUBLE_CLICK, e => this.onNodeDoubleClick(e));
    store.on(EVENTS.NODE_CONVERTED_TO_SUBCHART, e => this.onNodeConverted(e));
    store.on(EVENTS.NODE_CONVERTED_TO_NORMAL, e => this.onNodeConverted(e));
  }

  /**
   * Handles double click event on a node to open it
   * @param e
   */
  onNodeDoubleClick(e: DiagramEvent): void {
    const node = <Node>e.node;

    // Open node if is a Sub-Chart, and is not currently open
    if(node.isSubChart && !node.isOpen){
      this.jumpTo(node);
    }
  }

  /**
   * Handles node convertion event (convertion to sub-chart or to normal node) to rebuild the spatial indecies/map
   * @param e
   */
  onNodeConverted(e: DiagramEvent){
    setTimeout(() => {
      this.rebuildSpatialMap(this.store.currentlyOpenNode)
    }, 10);
  }

  /**
   * Caches the zoom level for each open sub-chart, so it can restored when a node get reopened
   */
  private onZoomChanged(): void {
    const key = this.currentNode?.id || 0;
    const zoom = this.store.zoomTransform;
    if(zoom){
      this.zoomTransforms.set(key, zoom);
    }
  }

  /**
   * Opens a specified node a the sub-chart and updates the breadcrumd / path to the current sub-chart node
   * @param node
   */
  public jumpTo(node: Node | null){
    if(node === this.currentNode) return;
    console.log('jumpTo', node)
    const stackIndex = this.stack.findIndex(item => item.node === node);
    console.log('stackIndex', stackIndex)
    console.log('stack', this.stack)
    if(stackIndex >= 0){
      this.stack.splice(stackIndex);
    }else{
      this.stack.push({
        node: this.currentNode,
        spatialMap: this.store.nodesSpatialMap,
      });
    }

    this.closeCurrent();
    this.currentNode = node;

    if(node){
      this.openNode(node);
    }else{
      this.openRootChart();
    }

    this.emitChangeEvent();
  }

  /**
   * Opens a specified node a the sub-chart
   * @param node
   */
  public openNode(node: Node){

    this.store.forceSynchronousUpdates = true;

    this.switchNodeState(node, true);

    const zoom = this.zoomTransforms.get(node.id) || zoomIdentity.translate(70, 50);
    this.store.emit(EVENTS.DIAGRAM_SET_ZOOM, { data: zoom });

    node.setShowContent(true, true);

    this.store.emit(EVENTS.NODE_GOT_OPEN, { node });

    setTimeout(() => this.rebuildSpatialMap(node), 10);

    this.store.forceSynchronousUpdates = false;
  }

  /**
   * Close the current sub-chart, and show all top level Nodes
   */
  public openRootChart(){
    const topLevelNodes = this.store.getTopLevelNodes();
    console.log('topLevelNodes', topLevelNodes)
    const zoom = this.zoomTransforms.get(0) || zoomIdentity.translate(70, 50);
    this.store.emit(EVENTS.DIAGRAM_SET_ZOOM, { data: zoom });
    // this.setSpatialMapNodes(topLevelNodes);
    setTimeout(() => this.setSpatialMapNodes(topLevelNodes), 10);
  }

  /**
   * Close the currently open sub-chart
   */
  public closeCurrent(){
    if(!this.currentNode) return;
    const node = this.currentNode;
    this.store.emit(EVENTS.NODE_CLOSING, { node: node });
    this.switchNodeState(node, false);
    node.setShowContent(false, true);
    this.store.emit(EVENTS.NODE_GOT_CLOSED, { node: node });
  }

  /**
   * Switch between nodes state (a node have two state, open state and normal state)
   * @param node Node to switch its state
   * @param open if `true` the open state will be applied the node, otherwise the normal state will be applied
   */
  private switchNodeState(node: Node, open: boolean){
    const { isOpen, openState, normalState } = node.props;
    const currentState = isOpen ? openState : normalState;
    const nextState = open ? openState : normalState;
    currentState.size = node.size;
    currentState.position = node.position;
    node.size = nextState.size || cloneObject(node.size);
    node.position = nextState.position || { x: 0, y: 0 };
    node.props.isOpen = open;
  }

  /**
   * Rebuilds the spacial map/indecies for the specified node and all its childs and sub-childs
   * @param rootNode The open node to add to the map
   */
  private rebuildSpatialMap(rootNode: Node | null){
    console.time('rebuildSpatialMap');
    const nsm = this.store.nodesSpatialMap;
    nsm.clear();
    if(rootNode){
      const visibleNodes = rootNode.getAllDescendentsNodes(true, true);
      this.setSpatialMapNodes(visibleNodes);
    }
    console.timeEnd('rebuildSpatialMap');
  }

  /**
   * Removes all current nodes in the index/map and adds the specified nodes
   * @param nodes Nodes to add
   */
  private setSpatialMapNodes(nodes: Node[]){
    const nsm = this.store.nodesSpatialMap;
    nsm.clear();
    nsm.load(nodes);
  }

  /**
   * Emits diagram path changed event (means that the path to the currenlty open node changed)
   */
  private emitChangeEvent(){
    const items = this.stack.map(si => si.node);
    items.push(this.currentNode);
    this.store.emit(EVENTS.DIAGRAM_CHARTS_PATH_CHANGED, { data: items });
    this.store.emit(EVENTS.DIAGRAM_CURRENT_NODE_CHANGED, { node: this.currentNode });
  }

}

interface ChartItem{
  node: Node | null,
  spatialMap: MyRBush
}
