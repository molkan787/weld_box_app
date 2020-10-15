import { zoomIdentity, ZoomTransform } from "d3";
import { Node } from "../components/node";
import { CLASSES, EVENTS } from "../constants";
import { DiagramStore, MyRBush } from "../diagram-store";
import { D3Node } from "../types/aliases";
import { DiagramEvent } from '../interfaces/DiagramEvent';
import { cs } from "../renderer/utils";
import { cloneObject } from "../utils";

export class SubChart{

  private readonly zoomTransforms: Map<number, ZoomTransform> = new Map();
  private readonly stack: ChartItem[] = [];

  public currentNode: Node | null = null;

  constructor(public store: DiagramStore){
    store.on(EVENTS.DIAGRAM_OPEN_NODE, ({node}: DiagramEvent) => this.open(<Node>node));
    store.on(EVENTS.DIAGRAM_BACK, () => this.back());
    store.on(EVENTS.DIAGRAM_ZOOM_CHANGED, () => this.onZoomChanged());
    store.on(EVENTS.NODE_CONTENT_GOT_SHOWN, e => this.onNodeContentGotShown(e));
    store.on(EVENTS.NODE_CONTENT_GOT_HIDDEN, e => this.onNodeContentGotHidden(e));
    store.on(EVENTS.NODE_DOUBLE_CLICK, e => this.onNodeDoubleClick(e));
  }

  onNodeDoubleClick(e: DiagramEvent): void {
    const node = <Node>e.node;

    // Open node if its content is hidden, and is not currently open
    if(!node.showContent && !node.props.isOpen){
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

  public open(node: Node){
    if(node === this.currentNode) return;

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

    const zoom = this.zoomTransforms.get(node.id) || zoomIdentity.translate(50, 50);
    this.store.emit(EVENTS.DIAGRAM_SET_ZOOM, { data: zoom });

    const nodesLayer = this._getNodesLayerDomElement();
    nodesLayer.appendChild(d3node.node());

    this.store.nodesSpatialMap = new MyRBush();
    node.showContent = true;
    this.store.nodesSpatialMap.insert(node);

    this.buildNodeBodyEdges(node);

    this.store.emit(EVENTS.NODE_GOT_OPEN, { node });
  }

  public back(){
    if(this.currentNode === null) return;

    const currentNode = this.currentNode;

    this.store.emit(EVENTS.NODE_CLOSING, { node: currentNode });

    const chartItem = <ChartItem>this.stack.pop();

    const currentD3Node = this.store.getD3Node(currentNode.id);
    currentD3Node.remove();

    this.switchNodeState(currentNode, false);
    currentNode.showContent = false;

    this.store.nodesSpatialMap = chartItem.spatialMap;

    this.currentNode = chartItem.node;

    const zoom = this.zoomTransforms.get(chartItem.node?.id || 0);
    this.store.emit(EVENTS.DIAGRAM_SET_ZOOM, { data: zoom });

    this.destroyNodeBodyEdges(currentNode);

    this.addD3NodesToDocument(chartItem.d3Nodes);

    this.addDomNodeToOriginalParent(currentNode);

    this.store.emit(EVENTS.NODE_BBOX_CHANGED, { node: currentNode });

    this.store.emit(EVENTS.NODE_GOT_CLOSED, { node: currentNode });
  }

  private destroyNodeBodyEdges(node: Node){
    const edges = node.edges.filter(e => e.isBridge).map(ec => ec.edge);
    this.store.emit(EVENTS.DIAGRAM_DESTROY_EDGES, { data: edges })
  }

  private buildNodeBodyEdges(node: Node){
    const edges = node.edges.filter(e => e.isBridge).map(ec => ec.edge);
    this.store.emit(EVENTS.DIAGRAM_BUILD_EDGES, { data: edges })
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

  }

}

interface ChartItem{
  node: Node | null,
  d3Nodes: D3Node[],
  spatialMap: MyRBush
}
