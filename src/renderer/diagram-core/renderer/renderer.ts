import { Component, ComponentType } from "../components/component";
import { Edge, MultipartEdgeLocation } from "../components/edge";
import { Node } from "../components/node";
import { EVENTS } from "../constants";
import { DiagramStore } from "../diagram-store";
import { EdgesBucket } from "../helper-classes/edges-bucket";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { Visibility } from "../modules/sub-modules/visibility";
import { D3Node } from "../types/aliases";
import { EdgeRenderer } from "./edge-renderer";
import { NodeRenderer } from "./node-renderer";

/**
 * This module handles the rendering logic for all Diagram's components
 */
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

  /**
   * Rebuilds the entire chart when the current node changes (the current node is the node that is currently open as a sub-chart)
   * @param event
   */
  onCurrentNodeChanged(event: DiagramEvent){
    const currentNode = <Node | null>event.node;
    console.log('CurrentNode', currentNode);
    this.clearContent();
    this.buildChart(currentNode);
    if(currentNode){
      this.store.emit(EVENTS.NODE_BBOX_CHANGED, { node: currentNode, simulated: true })
    }
  }

  /**
   * Removes all elements of all currently renderer diagram components from layers of the canvas
   */
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

  /**
   * Renders a node and all its childs, sub-childs... and all visible connected edges
   * @param chartNode The root node of the hierarchy to render
   */
  buildChart(chartNode: Node | null){
    if(chartNode){
      const components = this.getNodeVisibleContent(chartNode);
      this.buildComponents(components);
    }else{
      const topLevelNodes = this.store.getTopLevelNodes();
      this.buildComponents(topLevelNodes);
    }
  }

  /**
   * Re-render a node and all its childs, sub-childs... and all visible connected edges
   * @param node  The root node of the hierarchy to re-render
   */
  rebuildInChartNodeHierachy(node: Node){
    const componentsToDestroy = this.getNodeVisibleContent(node, true);
    const componentsToBuild = this.getNodeVisibleContent(node);
    this.destroyComponents(componentsToDestroy.reverse());
    this.buildComponents(componentsToBuild);
  }

  /**
   * Renders a list diagram's components on the canvas
   * @param components Components list to render
   */
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

  /**
   * Removes a list of diagram's component's DOM elements from the canvas
   * @param components List of components to destory
   */
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

  /**
   * Destorys diagram's component's DOM element
   * @param component The component to destroy
   */
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

  /**
   * Returns list of node's hierarchy components that are logically visible, assuming the root node is visible
   * @param node The root node
   * @param forceIncludeDirectChilds if `true` even if direct childs of the root node are not are logically not visible they will still be included in the result
   */
  getNodeVisibleContent(node: Node, forceIncludeDirectChilds: boolean = false): Component[]{
    const nodes: Component[] = node.getAllDescendentsNodes(true, !forceIncludeDirectChilds);
    const edges: Component[] = this.getNodesVisibleEdges(<Node[]>nodes);
    return nodes.concat(edges);
  }

  /**
   * Returns list of edges that are logically visible, assuming the provided nodes are visible
   * @param nodes Provided nodes will be used as the source of edges to search in
   */
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

  /**
   * Returns list of edges that are logically visible, assuming the provided node is visible
   * @param node Provided node will be used as the source of edges to search in
   */
  getNodeVisibleEdges(node: Node): Edge[]{
    const result: Edge[] = [];
    const ecs = node.edges;
    const len = ecs.length;
    for(let i = 0; i < len; i++){
      const ec = ecs[i];
      const edge = ec.edge;
      if(edge && Visibility.isEdgeVisible(edge, ec)){
        result.push(edge);
      }
    }
    return result;
  }

  /**
   * Rebuilds edge's DOM element
   * @param edge
   */
  rebuildEdge(edge: Edge){
    this.edgeRenderer.destroyElement(edge);
    this.buildComponent(null, edge);
  }

  /**
   * Finds and returns most optimal parent container for an edge (it can be the root edges layer, or a specific node's edges layer)
   * @param edge
   */
  getEdgeContainer(edge: Edge): D3Node{
    const { source, target } = edge;
    const node1 = source.isAttachedToNode() ? source.node : null;
    const node2 = target.isAttachedToNode() ? target.node : null;
    const usePublicGetter = edge.isMultipart && edge.multipartLocation == MultipartEdgeLocation.Inner;
    const stickToSource = edge.isStart;
    const parent = stickToSource ? node1 : this.findNearestCommonParent(node1, node2, usePublicGetter);

    if(parent === null){
      return <D3Node>this.edgesLayer;
    }else{
      const selector = this.nodeRenderer.getSVGGroupSelector(parent);
      return this.store.getD3Node(parent.id).select(selector);
    }
  }

  /**
   * Return the first common parent (ancestor) of two nodes
   * @param node1
   * @param node2
   * @param usePublicGetter if `true` an open node will be considered as a top level node (have no parent) event if it actuall does have a parent
   */
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

  /**
   * Builds node's DOM element when it got added to the Diagram
   * @param event
   */
  onNodeAdded(event: DiagramEvent){
    const node = <Node>event.node;
    const container = this.getNodeDomParent(node);
    this.buildComponent(container, node);
  }

  /**
   * Builds edge's DOM element if it is logically visivle when it got added to the Diagram
   * @param event
   */
  onEdgeAdded(event: DiagramEvent){
    const edge = <Edge>event.edge;
    const shouldRender = Visibility.isEdgeVisible(edge, null);
    console.log('shouldRender', shouldRender, edge)
    if(shouldRender){
      this.buildComponent(null, edge);
      this.store.emit(EVENTS.EDGE_CONNECTIONS_UPDATED, { edge: edge });
    }
  }

  /**
   * Return the parent DOM element on which the node should be renderer on,
   * if node has no parent, then the nodes layer will be return, otheriwse the DOM element of its parent will be returned
   * @param node
   */
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
        this.store.emit(EVENTS.NODE_BBOX_CHANGED, { node: child, sourceEvent: event, simulated: event.simulated });
      }
    }else{
      const childs = node.children;
      for(let i = 0; i < childs.length; i++){
        setTimeout(() => {
          this.store.emit(EVENTS.NODE_BBOX_CHANGED, { node: childs[i], sourceEvent: event, simulated: event.simulated });
        }, 1);
      }
    }

  }

  /**
   * Updates edge's DOM element when it was updated
   * @param event
   */
  onEdgeConnectionsUpdated(event: DiagramEvent){
    if(event.skipRendering) return;
    const edge = <Edge>event.edge;
    this.edgeRenderer.update(edge);
  }

  /**
   * Updates edge's DOM element when it was updated
   * @param event
   */
  onEdgeConnectionsChanged(event: DiagramEvent){
    if(event.skipRendering) return;
    const edge = <Edge>event.edge;
    this.rebuildEdge(edge);
  }

  /**
   * Updates edge's DOM element when its shape was changed
   * @param event
   */
  onEdgeReshaped(event: DiagramEvent){
    const edge = <Edge>event.edge;
    this.edgeRenderer.update(edge);
  }

  /**
   * Rebuilds all edges that are connected to a node that just changed his parent,
   * this is needed because currently edges are renderer on the node's old parent
   * @param event
   */
  onNodeParentChanged(event: DiagramEvent){
    const edges = (<Node>event.node).edges;
    edges.forEach(ec => this.rebuildEdge(<Edge>ec.edge));
  }

  /**
   * Rebuids node when it got converted to a sub-chart
   * @param event
   */
  onNodeConvertedToSubChart(event: DiagramEvent){
    const node = <Node>event.node;
    if(!event.simulated || event.isRestore){
      this.pushNodeSubChartConvertionAction(node, true);
    }
    setTimeout(() => this.rebuildConvertedNode(node), 0);
  }

  /**
   * Rebuids node when it got converted to a normal node
   * @param event
   */
  onNodeConvertedToNormal(event: DiagramEvent){
    const node = <Node>event.node;
    if(!event.simulated || event.isRestore){
      this.pushNodeSubChartConvertionAction(node, false);
    }
    setTimeout(() => this.rebuildConvertedNode(node), 0);
  }

  /**
   * Rebuilds a node that was converted to a sub-chart or back to a normal node
   * @param node
   */
  rebuildConvertedNode(node: Node){
    this.store.forceSynchronousUpdates = true;
    this.rebuildInChartNodeHierachy(node);
    this.store.emit(EVENTS.NODE_BBOX_CHANGED, { node });
    this.store.forceSynchronousUpdates = false;
  }

  /**
   * Create and push/add action to ActionsArchiver when a not got converted
   * @param node
   * @param isSubChart
   */
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

  /**
   * Destorys a list of edges' DOM elements in response to an Request event
   * @param event
   */
  onDestroyEdges(event: DiagramEvent){
    const edges = <Edge[]>event.data;
    for(const edge of edges){
      this.edgeRenderer.destroyElement(edge);
    }
  }

  /**
   * Renders a list of edges' DOM elements in response to an Request event
   * @param event
   */
  onBuildEdges(event: DiagramEvent){
    const edges = <Edge[]>event.data;
    for(const edge of edges){
      this.buildComponent(null, edge);
    }
  }

}
