import { Component, ComponentType } from "../components/component";
import { Edge } from "../components/edge";
import { AttachType } from "../components/edge-connection";
import { Node } from "../components/node";
import { EVENTS } from "../constants";
import { DiagramStore } from "../diagram-store";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { D3Node } from "../types/aliases";
import { EdgeRenderer } from "./edge-renderer";
import { NodeRenderer } from "./node-renderer";

export class Renderer{

  readonly nodeRenderer: NodeRenderer;
  readonly edgeRenderer: EdgeRenderer;
  private nodesLayer?: D3Node;
  private edgesLayer?: D3Node;

  constructor(readonly store: DiagramStore){
    this.nodeRenderer = new NodeRenderer(this.store);
    this.edgeRenderer = new EdgeRenderer(this.store);

    store.on(EVENTS.NODE_BBOX_CHANGED, e => this.onNodeBBoxChanged(e));
    store.on(EVENTS.NODE_ADDED, e => this.onNodeAdded(e));
    store.on(EVENTS.NODE_PARENT_CHANGED, e => this.onNodeParentChanged(e))
    store.on(EVENTS.NODE_ATTRS_CHANGED, e => this.onNodeAttrsChanged(e))

    store.on(EVENTS.EDGE_ADDED, e => this.onEdgeAdded(e));
    store.on(EVENTS.EDGE_CONNECTIONS_UPDATED, e => this.onEdgeConnectionsUpdated(e));
    store.on(EVENTS.EDGE_CONNECTIONS_CHANGED, e => this.onEdgeConnectionsChanged(e));

    store.on(EVENTS.DIAGRAM_DESTROY_EDGES, (e) => this.onDestroyEdges(e));
    store.on(EVENTS.DIAGRAM_BUILD_EDGES, (e) => this.onBuildEdges(e));

  }

  /**
   * Sets canvas layers that will be used as parents of nodes & edges separatly
   * @param nodesLayer D3 selection of DOM/SVG elements that should be used as nodes parent (container)
   * @param edgesLayer D3 selection of DOM/SVG elements that should be used as edges parent (container)
   */
  setLayers(nodesLayer: D3Node, edgesLayer: D3Node){
    this.nodesLayer = nodesLayer;
    this.edgesLayer = edgesLayer;
    this.nodeRenderer.setLayer(nodesLayer);
    this.edgeRenderer.prepareLayer(edgesLayer);
  }

  /**
   * Build a DOM element repesenting the diagram component
   * @param container DOM element to which add childs elements
   * @param component Diagram component, either `Node` or `Edge` instance
   */
  build(container: D3Node | null, component: Component){
    if(component.type === ComponentType.Node){
      this.nodeRenderer.build(container || <D3Node>this.nodesLayer, <Node>component);
    }else if(component.type === ComponentType.Edge){
      const edge = <Edge>component;
      const _container = container || this.getEdgeContainer(edge);
      this.edgeRenderer.build(_container, <Edge>component);
    }
  }

  /**
   * Updates visual representation of a component (Postion & Size on the canvas)
   * @param component The component instance to be updated
   */
  update(component: Component){
    if(component.type === ComponentType.Node){
      this.nodeRenderer.update(<Node>component);
    }else if(component.type === ComponentType.Edge){
      this.edgeRenderer.update(<Edge>component);
    }
  }

  rebuildEdge(edge: Edge){
    this.edgeRenderer.destroyElement(edge);
    this.build(null, edge);
  }

  getEdgeContainer(edge: Edge): D3Node{
    const { source, target } = edge;
    const node1 = source.isAttachedToNode() ? source.node : null;
    const node2 = target.isAttachedToNode() ? target.node : null;
    const commonParent = this.findNearestCommonParent(node1, node2);

    if(commonParent === null){
      return <D3Node>this.edgesLayer;
    }else{
      const selector = this.nodeRenderer.getSVGGroupSelector(commonParent);
      return this.store.getD3Node(commonParent.id).select(selector);
    }
  }

  private findNearestCommonParent(node1: Node | null, node2: Node | null): Node | null{
    const h1 = node1?.getHierarchyPath() || [];
    const h2 = node2?.getHierarchyPath() || [];
    h1.pop();
    h2.pop();
    let wereSame = false;
    let parent: Node | null = null;
    const len = Math.max(h1.length, h2.length);
    for(let i = 0; i < len; i++){
      const p1 = h1[i];
      const p2 = h2[i];
      const same = p1 === p2;
      if(same){
        wereSame = true;
        parent = p1;
      }else if(wereSame){
        break;
      }
    }
    return parent;
  }

  onNodeAdded(event: DiagramEvent){
    const node = <Node>event.node;
    const domParent = node.parent && this.store.getD3Node(node.parent.id);
    const container = <D3Node>domParent;
    this.build(container, node);
  }

  onEdgeAdded(event: DiagramEvent){
    this.build(null, <Edge>event.edge);
  }

  /**
   * Handles change of Node's bounding box, Usually triggered by `NodeDragging` module
   */
  onNodeBBoxChanged(event: DiagramEvent){
    const node = <Node>event.node;
    this.nodeRenderer.update(node);

    // Casting from (Edge | undefined)[] to Edge[] because undefined cases are already filtered out
    const edges = <Edge[]>(node.edges.map(ec => ec.edge).filter(e => !!e));

    if(!node.props.isOpen){
      // Updating positions of all edges that are connected to the Node currently being moved
      for(let edge of edges){
        this.store.emit(EVENTS.EDGE_CONNECTIONS_UPDATED, { edge });
      }
    }

    // If node's content (childs) are hidden we don't need to update them
    if(!node.showContent) return;

    for(let child of node.children){
      this.store.emit(EVENTS.NODE_BBOX_CHANGED, { node: child, sourceEvent: event });
    }

  }

  onEdgeConnectionsUpdated(event: DiagramEvent){
    const edge = <Edge>event.edge;
    this.edgeRenderer.update(edge);
  }

  onEdgeConnectionsChanged(event: DiagramEvent){
    const edge = <Edge>event.edge;
    this.rebuildEdge(edge);
  }

  onNodeParentChanged(event: DiagramEvent){
    const edges = (<Node>event.node).edges;
    edges.forEach(ec => this.rebuildEdge(<Edge>ec.edge));
  }

  onNodeAttrsChanged(event: DiagramEvent){
    const node = <Node>event.node;
    if(node.showContent){
      this.store.emit(EVENTS.NODE_BBOX_CHANGED, { node, sourceEvent: event });
    }
  }

  onDestroyEdges(event: DiagramEvent){
    const edges = <Edge[]>event.data;
    for(const edge of edges){
      this.edgeRenderer.destroyElement(edge);
    }
  }

  onBuildEdges(event: DiagramEvent){
    const edges = <Edge[]>event.data;
    for(const edge of edges){
      this.build(null, edge);
    }
  }

}
