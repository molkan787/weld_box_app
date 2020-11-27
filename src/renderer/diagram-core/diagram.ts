import './styles/diagram.less'
import { select, zoom, ZoomBehavior, ZoomTransform, zoomIdentity } from 'd3';
import { D3Node } from './types/aliases';
import { DiagramOptions } from './interfaces/DiagramOptions';
import { NodeDragging } from './modules/node-dragging';
import { Node } from './components/node';
import { Renderer } from './renderer/renderer';
import { Edge } from './components/edge';
import { DiagramStore } from './diagram-store';
import { EVENTS } from './constants';
import { TreeManager } from './modules/tree-manager';
import { EdgeDrawer } from './modules/edge-drawer';
import { DiagramEvent } from './interfaces/DiagramEvent';
import { Position } from './interfaces/Position';
import { SubChart } from './modules/sub-chart';
import { DomEventsAttacher } from './modules/dom-events-attacher';
import { InitialNodeDragging } from './modules/initial-node-dragging';
import { EdgeSelector } from './modules/edge-selector';
import { ComponentDeleter } from './modules/component-deleter';
import { EdgeReshaper } from './modules/edge-reshaper';
import { Component, ComponentType } from './components/component';
import { EdgesMutator } from './modules/edges-mutator';
import { InitialEdgeDragging } from './modules/initial-edge-dragging';

/**
 * Entry class that wraps and control all sub-modules of the Diagram
 */
export class Diagram{

  /** Diagram's store */
  readonly store = new DiagramStore(this.options);
  /** Root element of the chart/diagram */
  readonly chart: D3Node;
  /** Nodes container element */
  private nodesLayer: D3Node;
  /** Edges container element */
  private edgesLayer: D3Node;

  /** The D3.ZoomBehavior instance */
  private zoomController: ZoomBehavior<Element, unknown>;

  /** The renderering module instance of the Diagram */
  private readonly renderer = new Renderer(this.store);

  /** An object containing refference to all Diagram's modules */
  private readonly modules: any;

  constructor(parentSelector: string, public readonly options: DiagramOptions){
    const { width, height, chartClasses } = options;

    this.modules = {
      edgeSelector: new EdgeSelector(this.store),
      nodeDragging: new NodeDragging(this.store),
      treeManager: new TreeManager(this.store),
      edgeDrawer: new EdgeDrawer(this.store),
      edgesMutator: new EdgesMutator(this.store),
      subChart: new SubChart(this.store),
      initialNodeDragging: new InitialNodeDragging(this.store),
      initialEdgeDragging: new InitialEdgeDragging(this.store),
      componentDeleter: new ComponentDeleter(this.store),
      edgeReshaper: new EdgeReshaper(this.store),
      domEventsAttacher: new DomEventsAttacher(this.store), // its important initialize DomEventsAttacher after all other modules
    }

    this.modules.nodeDragging.activate();

    this.store.on(EVENTS.EDGE_CREATED, ({edge}: DiagramEvent) => this.addEdge(<Edge>edge));
    this.store.on(EVENTS.DIAGRAM_RESTORE_COMPONENT, (e: DiagramEvent) => this.addComponent(<Component>e.data, true));
    this.store.on(EVENTS.DIAGRAM_ZOOM_CHANGED, () => this.onZoomChanged());
    this.store.on(EVENTS.DIAGRAM_SET_ZOOM, e => this.setZoom(e));

    // Initializing diagram canvas
    const chart = select(parentSelector)
      .append('div')
      .classed('diagram', true)
      .attr('canvas', 'true')
      .attr('style', `width:${width}px;height:${height}px`)
    if(chartClasses) chart.classed(chartClasses, true);

    const { x, y } = (<HTMLElement>chart.node()).getBoundingClientRect();
    this.store.setCanvasOffset({ x, y });

    this.store.setRootElement(chart);

    this.nodesLayer = chart.append('div')
                            .attr('canvas', 'true')
                            .classed('nodes-layer', true);

    this.edgesLayer = chart.append('svg')
                            .attr('canvas', 'true')
                            .classed('edges-layer', true)
                            .attr('width', width)
                            .attr('height', height)
                            .append('g');


    const _zoom = zoom()
    .extent([[0, 0], [width, height]])
    .scaleExtent([0.1, 4])
    .on('zoom', (payload: any) => this.store.setZoomTransform(payload.transform))

    chart.call(<any>_zoom);
    chart.on("dblclick.zoom", null);
    chart.on('click', (e: any) => this.onChartClick(e));

    this.chart = chart;
    this.renderer.setLayers(this.nodesLayer, this.edgesLayer);
    this.zoomController = _zoom;
  }

  /** Handler of mouse click on the root element of the chart */
  onChartClick(e: MouseEvent): void {
    if((<HTMLElement>e.target).getAttribute('canvas') === 'true'){
      this.deselectAll();
    }
  }

  /** Resets zoom and drag offset of the canvas to the initial state (zoom = 1, offset = 0,0) */
  resetZoom(){
    this.setZoom({
      data: zoomIdentity
    })
  }

  /** Sets zoom and drag offset */
  setZoom(e: DiagramEvent): void {
    const zoom = <ZoomTransform | null>e.data;
    this.zoomController.transform(this.chart, zoom || zoomIdentity);
  }

  /** Access the current open node (the node that is open as a sub-chart) */
  public get currentNode(): Node | null{
    return this.modules?.subChart?.currentNode;
  }

  /** Deselect any selected object on the canvas */
  public deselectAll(){
    this.store.emit(EVENTS.NODE_SELECTED, {});
    this.store.emit(EVENTS.EDGE_SELECTED, {});
  }

  /** Deletes any selected object on the canvas */
  public deleteSelectedComponent(): boolean{
    const component = this.store.selectedComponent;
    this.deselectAll();
    if(component){
      this.store.emit(EVENTS.DIAGRAM_DELETE_COMPONENT, { data: component });
      return true;
    }else{
      return false;
    }
  }

  /** Undo the last user action */
  public undo(removeAction?: boolean){
    this.store.actionsArchiver.undo(removeAction);
  }

  /** Redo the previously undone user action */
  public redo(){
    this.store.actionsArchiver.redo();
  }

  /** Jump back in sub-charts hierarchy stack by one level */
  public back(){
    this.store.emit(EVENTS.DIAGRAM_BACK, {});
  }

  /** Open a node as a sub-chart */
  public openNode(node: Node){
    this.store.emit(EVENTS.DIAGRAM_OPEN_NODE, { node });
  }

  /** Jump to any node (open its as a sub-chart),
   * If the node were already open and it is in the sub-charts hierarchy stack, just jump back to its level
   */
  public jumpToNode(node: Node){
    this.store.emit(EVENTS.DIAGRAM_JUMP_TO_NODE, { node });
  }

  /**
   * Add a component (node or edge) to the diagram so it can get rendered and added to the physics, essentialy making it alive
   * @param component The component to be added
   * @param isRestore `true` to skip adding any entry to the Actions Archiver
   */
  public addComponent(component: Component, isRestore?: boolean){
    if(component.type == ComponentType.Node){
      this.addNode(<Node>component, isRestore);
    }else if(component.type == ComponentType.Edge){
      this.addEdge(<Edge>component, isRestore);
    }
  }

  /**
   * Add node to the Diagram, This method need to be called for each New Node in order to be part of the Diagram
   * if node has children when adding it, adding childs nodes can be skiped
   * @param isRestore `true` to skip adding any entry to the Actions Archiver
   * @param node Node instance to add
   */
  public addNode(node: Node, isRestore?: boolean){
    node.store = this.store;
    if(!this.store.addNode(node)) return;
    this.store.emit(EVENTS.NODE_ADDED, { node, isRestore })
    for(let child of node.children){
      this.addNode(child, isRestore);
    }
  }

  /**
   * Add edge to the Diagram, This method need to be called for each New Edge in order to be part of the Diagram
   * @param edge Edge instance to add
   * @param isRestore `true` to skip adding any entry to the Actions Archiver
   */
  public addEdge(edge: Edge, isRestore?: boolean){
    edge.store = this.store;
    if(!this.store.addEdge(edge)) return;
    this.store.emit(EVENTS.EDGE_ADDED, { edge, isRestore })
  }

  /** Activate Edge Drawer module */
  public activateEdgeDrawer(){
    this.modules.edgeDrawer.activate();
  }

  /** Deactivate Edge Drawer module */
  public deactivateEdgeDrawer(){
    this.modules.edgeDrawer.deactivate();
  }

  /**
   * Adds a Node at the specified postion, and immidiatly activating dragging for that node,
   * this methods is in combination with UI ToolBox
  */
  public spawnNodeAt(point: Position, node: Node){
    this.addNode(node);
    this.store.emit(EVENTS.DIAGRAM_START_NODE_DRAGGING, {
      node,
      data: point
    });
  }

  /**
   * Create an Action that indicates that a node was added and push it to the Actions Archiver stack
   * @param node The added node
   */
  public pushNodeAddedAction(node: Node){
    this.store.actionsArchiver.push({
      undo: [
        {
          events: [EVENTS.DIAGRAM_DELETE_COMPONENT],
          eventsPayload: { data: node },
          do: () => 0
        }
      ],
      redo: [
        {
          events: [EVENTS.DIAGRAM_RESTORE_COMPONENT],
          eventsPayload: { data: node },
          do: this.store.stateSnaper.snapNodeAsRestorer(node)
        }
      ]
    })
  }

  public spawnEdgeAt(point: Position, edge: Edge){
    this.addEdge(edge);
    this.store.emit(EVENTS.DIAGRAM_START_EDGE_DRAGGING, {
      edge,
      data: point
    });
  }

  /**
   * Simulates a MouseMove event on root/canvas element,
   * Basicaly re-emits the original mouse move event
   * @param event The original mouse move event
   */
  public simulateCanvasMouseMove(event: MouseEvent){
    this.store.emit(EVENTS.CANVAS_MOUSEMOVE, { sourceEvent: event });
  }

  /**
   * Handles the zoom changed event to apply the Transformation on the actuall chart DOM elements
   */
  private onZoomChanged() {
    const transform: any = this.store.zoomTransform;
    transform.toString2 = function (){
      return "translate(" + this.x + "px," + this.y + "px) scale(" + this.k + ")";
    }
    if(transform){
      this.nodesLayer.style('transform', transform.toString2());
      this.edgesLayer.attr('transform', transform);
    }else{
      this.nodesLayer.style('transform', null);
      this.edgesLayer.attr('transform', null);
    }
  }

  /**
   * Wrapper around the events bus on() method
   * @param eventType
   * @param handler
   */
  public on(eventType: string, handler: (e: DiagramEvent) => void){
    this.store.on(eventType, handler);
    return this;
  }

  /**
   * Clear all actions in the Actions Archiver
   */
  public clearActionsArchiver(){
    this.store.actionsArchiver.clear();
  }

  /**
   * Wrapper around ActionsArchiver.lock(), check the methods itself
   */
  public lockActionsArchiver(){
    this.store.actionsArchiver.lock();
  }

  /**
   * Wrapper around ActionsArchiver.unlock(), check the methods itself
   */
  public unlockActionsArchiver(){
    this.store.actionsArchiver.unlock();
  }

  /**
   * Access the ActionArchiver instance of this diagram
   */
  public get actionsArchiver(){
    return this.store.actionsArchiver;
  }

  /**
   * Returns a module
   * @param name Name of the module to return (modules names can be found in the constants.ts file)
   */
  public getModule(name: string): any{
    return this.modules[name];
  }

}
