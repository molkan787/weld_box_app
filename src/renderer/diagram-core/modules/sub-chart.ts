import { zoomIdentity, ZoomTransform } from "d3";
import { Node } from "../components/node";
import { CLASSES, DATA_COMMANDS, EVENTS } from "../constants";
import { DiagramStore, MyRBush } from "../diagram-store";
import { D3Node } from "../types/aliases";
import { DiagramEvent } from '../interfaces/DiagramEvent';
import { cs } from "../renderer/utils";
import { cloneObject } from "../utils";
import { MultipartEdgeLocation } from "../components/edge";
import { AttachType } from "../components/edge-connection";

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
    store.on(EVENTS.DIAGRAM_OPEN_NODE, ({node}: DiagramEvent) => this.open(<Node>node));
    store.on(EVENTS.DIAGRAM_JUMP_TO_NODE, ({node}: DiagramEvent) => this.jumpTo(<Node | null>node));
    store.on(EVENTS.DIAGRAM_BACK, () => this.back());
    store.on(EVENTS.DIAGRAM_ZOOM_CHANGED, () => this.onZoomChanged());
    store.on(EVENTS.NODE_CONTENT_GOT_SHOWN, e => this.onNodeContentGotShown(e));
    store.on(EVENTS.NODE_CONTENT_GOT_HIDDEN, e => this.onNodeContentGotHidden(e));
    store.on(EVENTS.NODE_DOUBLE_CLICK, e => this.onNodeDoubleClick(e));
  }

  onNodeDoubleClick(e: DiagramEvent): void {
    const node = <Node>e.node;

    // Open node if its content is hidden, and is not currently open
    if(node.isSubChart && !node.isOpen){
      this.open(node);
    }
  }

  private onZoomChanged(): void {
    const key = this.currentNode?.id || 0;
    const zoom = this.store.zoomTransform;
    if(zoom){
      this.zoomTransforms.set(key, zoom);
    }
  }

  public jumpTo(node: Node | null){
    if(node === this.currentNode) return;
    const path = this.findPath(node);
    if(path){
      for(const n of path){
        this.open(n);
      }
    }else{
      while(this.stack.length && this.currentNode !== node){
        console.log(this.currentNode?.name);
        this.back();
      }
      console.log(this.currentNode?.name);
    }
  }

  public open(node: Node){
    if(node === this.currentNode) return;

    this.store.forceSynchronousUpdates = true;

    const oldCurrentNode = this.currentNode;
    if(oldCurrentNode){
      this.store.emit(EVENTS.NODE_CLOSING, { node: oldCurrentNode });
      oldCurrentNode.setShowContent(true, true);
    }

    if(oldCurrentNode){
      this.destroyNodeInnerEdges(oldCurrentNode);
    }

    const d3node = this.store.getD3Node(node.id);
    d3node.remove();
    const removedContent = this.removeContentFromCanvas();

    this.stack.push({
      node: this.currentNode,
      d3Nodes: removedContent,
      spatialMap: this.store.nodesSpatialMap,
    });

    this.switchNodeState(node, true);

    this.currentNode = node;

    const zoom = this.zoomTransforms.get(node.id) || zoomIdentity.translate(70, 50);
    this.store.emit(EVENTS.DIAGRAM_SET_ZOOM, { data: zoom });

    const nodesLayer = this._getNodesLayerDomElement();
    nodesLayer.appendChild(d3node.node());

    this.buildNodeInnerEdges(node);

    this.store.nodesSpatialMap = new MyRBush();
    node.setShowContent(true, true);
    this.store.nodesSpatialMap.insert(node);

    if(oldCurrentNode){
      this.store.emit(EVENTS.NODE_GOT_CLOSED, { node: oldCurrentNode });
    }
    this.store.emit(EVENTS.NODE_GOT_OPEN, { node });
    this.emitChangeEvent();

    this.store.forceSynchronousUpdates = false;
  }

  public back(){
    if(this.currentNode === null) return;

    this.store.forceSynchronousUpdates = true;

    const oldCurrentNode = this.currentNode;

    this.store.emit(EVENTS.NODE_CLOSING, { node: oldCurrentNode });
    oldCurrentNode.setShowContent(true, true);

    const chartItem = <ChartItem>this.stack.pop();

    const currentD3Node = this.store.getD3Node(oldCurrentNode.id);
    currentD3Node.remove();

    const newCurrentNode = chartItem.node;
    this.currentNode = newCurrentNode;

    if(newCurrentNode){
      this.buildNodeInnerEdges(newCurrentNode);
    }

    oldCurrentNode.setShowContent(false, true);
    this.switchNodeState(oldCurrentNode, false);

    this.store.nodesSpatialMap = chartItem.spatialMap;

    const zoom = this.zoomTransforms.get(chartItem.node?.id || 0);
    this.store.emit(EVENTS.DIAGRAM_SET_ZOOM, { data: zoom });

    this.destroyNodeInnerEdges(oldCurrentNode);

    this.addD3NodesToDocument(chartItem.d3Nodes);

    this.addDomNodeToOriginalParent(oldCurrentNode);

    this.store.emit(EVENTS.NODE_GOT_CLOSED, { node: oldCurrentNode });
    this.store.emit(EVENTS.NODE_GOT_OPEN, { node: newCurrentNode });

    // `this.currentNode` is the new current node
    // `currentNode` is the previous current node
    if(this.currentNode){
      this.store.emit(EVENTS.NODE_BBOX_CHANGED, { node: this.currentNode });
    }else{
      this.store.emit(EVENTS.NODE_BBOX_CHANGED, { node: oldCurrentNode });
    }

    this.emitChangeEvent();

    this.store.forceSynchronousUpdates = false;
  }

  private destroyNodeInnerEdges(node: Node){
    const edges = node.edges
    .filter(ec => ec.attachType == AttachType.NodeBody)
    .map(ec => ec.edge)
    .filter(e => e?.isMultipart && e.multipartLocation == MultipartEdgeLocation.Inner);
    this.store.emit(EVENTS.DIAGRAM_DESTROY_EDGES, { data: edges });
  }

  private buildNodeInnerEdges(node: Node){
    const edges = node.edges
    .filter(ec => ec.attachType == AttachType.NodeBody)
    .map(ec => ec.edge)
    .filter(e => e?.isMultipart && e.multipartLocation == MultipartEdgeLocation.Inner);
    this.store.emit(EVENTS.DIAGRAM_BUILD_EDGES, { data: edges });
  }

  private addDomNodeToOriginalParent(node: Node){
    const d3Node = this.store.getD3Node(node.id);
    const parent = node.parent;
    if(parent){
      const d3Parent = this.store.getD3Node(parent.id);
      const domParent = <HTMLElement>d3Parent.select(cs(CLASSES.NODE_BODY)).node();
      domParent.appendChild(d3Node.node());
    }else{
      this._getNodesLayerDomElement().appendChild(d3Node.node());
    }
  }

  private addD3NodesToDocument(d3Nodes: D3Node[]){
    const domParent = this._getNodesLayerDomElement();
    for(let d3node of d3Nodes){
      domParent.appendChild(d3node.node());
    }
  }

  private removeContentFromCanvas(){
    const result: D3Node[] = [];
    const nodes = this.currentNode ? [this.currentNode] : this.store.nodes;
    for(let node of nodes){
      if(node.parent === null){
        const d3node = this.store.getD3Node(node.id);
        d3node.remove();
        result.push(d3node);
      }
    }
    return result;
  }

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

  private _getNodesLayerDomElement(){
    return <HTMLElement>this.store.rootElement.select('.nodes-layer').node();
  }

  private onNodeContentGotShown(event: DiagramEvent){
    const node = <Node>event.node;

    const allDesendents = node.getAllDescendentsNodes(true);

    // remove the first item which is the node in context, because its does not need any changes
    allDesendents.shift();

    // adding all desendents to the currently used Spatial Map
    this.store.nodesSpatialMap.load(allDesendents);
  }

  private onNodeContentGotHidden(event: DiagramEvent){
    const node = <Node>event.node;
    const allDesendents = node.getAllDescendentsNodes(true);

    // remove the first item which is the node in context, because its does not need any changes
    allDesendents.shift();

    const len = allDesendents.length;
    for(let i = 0; i < len; i++){
      this.store.nodesSpatialMap.remove(allDesendents[i]);
    }

    if(event.data == DATA_COMMANDS.DESTROY_MULTIPART_INNER_EDGES){
      this.destroyNodeInnerEdges(node);
    }

  }

  private findPath(target: Node | null): Node[] | null{
    if(target === null || target === this.currentNode) return null;
    const index1 = this.stack.findIndex((ci) => ci.node === target);
    if(index1 >= 0) return null;

    const path: Node[] = [];
    const hierarchy = target.getHierarchyPath();
    const index2 = this.currentNode ? hierarchy.indexOf(this.currentNode) : -1;
    const start = index2 >= 0 ? index2 : 0;

    for(let i = start; i < hierarchy.length; i++){
      const n = hierarchy[i];
      if(n.isSubChart){
        path.push(n);
      }
    }
    path.push(target);

    return path;
  }

  private emitChangeEvent(){
    const items = this.stack.map(si => si.node);
    items.push(this.currentNode);
    this.store.emit(EVENTS.DIAGRAM_CHARTS_PATH_CHANGED, { data: items });
  }

}

interface ChartItem{
  node: Node | null,
  d3Nodes: D3Node[],
  spatialMap: MyRBush
}
