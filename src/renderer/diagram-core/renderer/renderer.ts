import { Component, ComponentType } from "../components/component";
import { Edge, MultipartEdgeLocation, MultipartEdgeType } from "../components/edge";
import { AttachType } from "../components/edge-connection";
import { Node } from "../components/node";
import { EVENTS } from "../constants";
import { DiagramStore } from "../diagram-store";
import { EdgesBucket } from "../helper-classes/edges-bucket";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { Visibility } from "../modules/sub-modules/visibility";
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

    store.on(EVENTS.DIAGRAM_CURRENT_NODE_CHANGED, e => this.onCurrentNodeChanged(e));

    store.on(EVENTS.NODE_BBOX_CHANGED, e => this.onNodeBBoxChanged(e));
    store.on(EVENTS.NODE_ADDED, e => this.onNodeAdded(e));
    store.on(EVENTS.NODE_PARENT_CHANGED, e => this.onNodeParentChanged(e))
    // store.on(EVENTS.NODE_ATTRS_CHANGED, e => this.onNodeAttrsChanged(e))
    store.on(EVENTS.NODE_CONVERTED_TO_SUBCHART, e => this.onNodeConvertedToSubChart(e));
    store.on(EVENTS.NODE_CONVERTED_TO_NORMAL, e => this.onNodeConvertedToNormal(e));

    store.on(EVENTS.EDGE_ADDED, e => this.onEdgeAdded(e));
    store.on(EVENTS.EDGE_CONNECTIONS_UPDATED, e => this.onEdgeConnectionsUpdated(e));
    store.on(EVENTS.EDGE_CONNECTIONS_CHANGED, e => this.onEdgeConnectionsChanged(e));
    store.on(EVENTS.EDGE_RESHAPED, e => this.onEdgeReshaped(e));

    store.on(EVENTS.DIAGRAM_DESTROY_EDGES, (e) => this.onDestroyEdges(e));
    store.on(EVENTS.DIAGRAM_BUILD_EDGES, (e) => this.onBuildEdges(e));

    // if a node got selected, diselect any selected edge
    store.on(EVENTS.NODE_SELECTED, (e: DiagramEvent) => {
      if(e.node) store.emit(EVENTS.EDGE_SELECTED, { simulated: true });
      if(e.node) console.log(e.node)
      store.selectedComponent = e.node || null;
    })
    // if an edge got selected, diselect any selected node
    store.on(EVENTS.EDGE_SELECTED, (e: DiagramEvent) => {
      if(e.edge) store.emit(EVENTS.NODE_SELECTED, { simulated: true });
      if(e.edge) console.log(e.edge)
      store.selectedComponent = e.edge || null;
    })

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

  onCurrentNodeChanged(event: DiagramEvent){
    const currentNode = <Node | null>event.node;
    console.log('CurrentNode', currentNode);
    this.clearContent();
    this.buildChart(currentNode);
    if(currentNode){
      this.store.emit(EVENTS.NODE_BBOX_CHANGED, { node: currentNode })
    }
  }

  clearContent(){
    const d3Nodes = this.store.d3NodesMap.values();
    for(let d3Node of d3Nodes){
      const component = <any>d3Node.data()[0];
      component.BeforeDOMElementDestroy(d3Node);
    }
    this.store.d3NodesMap.clear();

    const nl = <HTMLElement>this.nodesLayer?.node();
    const el = <HTMLElement>this.edgesLayer?.node();
    nl.innerHTML = '';
    el.innerHTML = '';
  }

  buildChart(chartNode: Node | null){
    if(chartNode){
      const components = this.getNodeVisibleContent(chartNode);
      this.buildComponents(components);
    }else{
      const topLevelNodes = this.store.getTopLevelNodes();
      this.buildComponents(topLevelNodes);
    }
  }

  rebuildInChartNodeHierachy(node: Node){
    const componentsToDestroy = this.getNodeVisibleContent(node, true);
    const componentsToBuild = this.getNodeVisibleContent(node);
    this.destroyComponents(componentsToDestroy.reverse());
    this.buildComponents(componentsToBuild);
  }

  buildComponents(components: Component[]){
    for(let component of components){
      this.buildComponent(null, component);
    }
  }

  /**
   * Build a DOM element repesenting the component
   * @param container DOM element to which add childs elements
   * @param component Component, either `Node` or `Edge` instance
   */
  buildComponent(container: D3Node | null, component: Component){
    if(component.type === ComponentType.Node){
      this.nodeRenderer.build(container || this.getNodeDomParent(<Node>component) || <D3Node>this.nodesLayer, <Node>component);
    }else if(component.type === ComponentType.Edge){
      const edge = <Edge>component;
      const _container = container || this.getEdgeContainer(edge);
      this.edgeRenderer.build(_container, <Edge>component);
    }
  }

  destroyComponents(components: Component[]){
    const len = components.length;
    for(let i = 0; i < len; i++){
      try {
        console.log('destorying ' + (<any>components[i]).name)
        this.destroyComponent(components[i]);
      } catch (error) {

      }
    }
  }

  destroyComponent(component: Component){
    const d3Node = this.store.getD3Node(component.id);
    const com = <Node | Edge>component;
    com.BeforeDOMElementDestroy(d3Node);
    d3Node.remove();
    this.store.d3NodesMap.delete(component.id);
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

  getNodeVisibleContent(node: Node, forceIncludeDirectChilds: boolean = false): Component[]{
    const nodes: Component[] = node.getAllDescendentsNodes(true, !forceIncludeDirectChilds);
    const edges: Component[] = this.getNodesVisibleEdges(<Node[]>nodes);
    return nodes.concat(edges);
  }

  getNodesVisibleEdges(nodes: Node[]): Edge[]{
    const bucket = new EdgesBucket();

    const len = nodes.length;
    for(let i = 0; i < len; i++){
      bucket.add(
        this.getNodeVisibleEdges(nodes[i])
      );
    }

    return bucket.getAll();
  }

  getNodeVisibleEdges(node: Node): Edge[]{
    const result: Edge[] = [];
    const ecs = node.edges;
    const len = ecs.length;
    for(let i = 0; i < len; i++){
      const ec = ecs[i];
      const edge = ec.edge;
      if(edge && Visibility.isEdgeVisible(edge)){
        result.push(edge);
      }
    }
    return result;
  }

  rebuildEdge(edge: Edge){
    this.edgeRenderer.destroyElement(edge);
    this.buildComponent(null, edge);
  }

  getEdgeContainer(edge: Edge): D3Node{
    const { source, target } = edge;
    const node1 = source.isAttachedToNode() ? source.node : null;
    const node2 = target.isAttachedToNode() ? target.node : null;
    const usePublicGetter = edge.isMultipart && edge.multipartLocation == MultipartEdgeLocation.Inner;
    const stickToSource = source.attachType == AttachType.Node && source.node?.isSubChart;
    const parent = stickToSource ? node1 : this.findNearestCommonParent(node1, node2, usePublicGetter);

    if(parent === null){
      return <D3Node>this.edgesLayer;
    }else{
      const selector = this.nodeRenderer.getSVGGroupSelector(parent);
      return this.store.getD3Node(parent.id).select(selector);
    }
  }

  private findNearestCommonParent(node1: Node | null, node2: Node | null, usePublicGetter: boolean): Node | null{
    const h1 = node1?.getHierarchyPath(usePublicGetter) || [];
    const h2 = node2?.getHierarchyPath(usePublicGetter) || [];
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
    const container = this.getNodeDomParent(node);
    this.buildComponent(container, node);
  }

  onEdgeAdded(event: DiagramEvent){
    const edge = <Edge>event.edge;
    const shouldRender = Visibility.isEdgeVisible(edge);
    console.log('shouldRender', shouldRender, edge)
    if(shouldRender){
      this.buildComponent(null, edge);
      this.store.emit(EVENTS.EDGE_CONNECTIONS_UPDATED, { edge: edge });
    }
  }

  getNodeDomParent(node: Node){
    const domParent = node.parent && this.store.getD3Node(node.parent.id);
    return <D3Node | null>domParent;
  }

  /**
   * Handles change of Node's bounding box, Usually triggered by `NodeDragging` module
   */
  onNodeBBoxChanged(event: DiagramEvent){
    const node = <Node>event.node;
    this.nodeRenderer.update(node);

    // If node's content (childs) are hidden we don't need to update them
    if(!node.showContent) return;

    if(this.store.forceSynchronousUpdates){
      for(let child of node.children){
        this.store.emit(EVENTS.NODE_BBOX_CHANGED, { node: child, sourceEvent: event });
      }
    }else{
      const childs = node.children;
      for(let i = 0; i < childs.length; i++){
        setTimeout(() => {
          this.store.emit(EVENTS.NODE_BBOX_CHANGED, { node: childs[i], sourceEvent: event });
        }, 1);
      }
    }

  }

  onEdgeConnectionsUpdated(event: DiagramEvent){
    if(event.skipRendering) return;
    const edge = <Edge>event.edge;
    this.edgeRenderer.update(edge);
  }

  onEdgeConnectionsChanged(event: DiagramEvent){
    if(event.skipRendering) return;
    const edge = <Edge>event.edge;
    this.rebuildEdge(edge);
  }

  onEdgeReshaped(event: DiagramEvent){
    const edge = <Edge>event.edge;
    this.edgeRenderer.update(edge);
  }

  onNodeParentChanged(event: DiagramEvent){
    const edges = (<Node>event.node).edges;
    edges.forEach(ec => this.rebuildEdge(<Edge>ec.edge));
  }

  onNodeConvertedToSubChart(event: DiagramEvent){
    const node = <Node>event.node;
    if(!event.simulated || event.isRestore){
      this.pushNodeSubChartConvertionAction(node, true);
    }
    setTimeout(() => this.rebuildConvertedNode(node), 0);
  }

  onNodeConvertedToNormal(event: DiagramEvent){
    const node = <Node>event.node;
    if(!event.simulated || event.isRestore){
      this.pushNodeSubChartConvertionAction(node, false);
    }
    setTimeout(() => this.rebuildConvertedNode(node), 0);
  }

  rebuildConvertedNode(node: Node){
    this.store.forceSynchronousUpdates = true;
    this.rebuildInChartNodeHierachy(node);
    this.store.emit(EVENTS.NODE_BBOX_CHANGED, { node });
    this.store.forceSynchronousUpdates = false;
  }

  pushNodeSubChartConvertionAction(node: Node, isSubChart: boolean){
    const toSubChart = () => node.convertToSubChart(true);
    const toNormal = () => node.convertToNormal(true);
    this.store.actionsArchiver.push({
      undo: [{
        events: [],
        do: isSubChart ? toNormal : toSubChart
      }],
      redo: [{
        events: [],
        do: isSubChart ? toSubChart : toNormal
      }]
    })
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
      this.buildComponent(null, edge);
    }
  }

}
