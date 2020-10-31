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
import { ActionsArchiver } from './modules/actions-archiver';

/**
 * `Diagram`
 * Entry class that wraps and control all sub-modules of the Diagram
 */
export class Diagram{

  readonly store = new DiagramStore(this.options);
  readonly chart: D3Node;
  private nodesLayer: D3Node;
  private edgesLayer: D3Node;

  private zoomController: ZoomBehavior<Element, unknown>;

  private readonly renderer = new Renderer(this.store);

  private readonly modules: any;

  constructor(parentSelector: string, public readonly options: DiagramOptions){
    const { width, height, chartClasses } = options;

    this.modules = {
      edgeSelector: new EdgeSelector(this.store),
      nodeDragging: new NodeDragging(this.store),
      treeManager: new TreeManager(this.store),
      edgeDrawer: new EdgeDrawer(this.store, options),
      subChart: new SubChart(this.store),
      initialNodeDragging: new InitialNodeDragging(this.store),
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

  onChartClick(e: MouseEvent): void {
    if((<HTMLElement>e.target).getAttribute('canvas') === 'true'){
      this.deselectAll();
    }
  }

  resetZoom(){
    this.setZoom({
      data: zoomIdentity
    })
  }

  setZoom(e: DiagramEvent): void {
    const zoom = <ZoomTransform | null>e.data;
    this.zoomController.transform(this.chart, zoom || zoomIdentity);
  }

  public get currentNode(): Node | null{
    return this.modules?.subChart?.currentNode;
  }

  public deselectAll(){
    this.store.emit(EVENTS.NODE_SELECTED, {});
    this.store.emit(EVENTS.EDGE_SELECTED, {});
  }

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

  public undo(removeAction?: boolean){
    this.store.actionsArchiver.undo(removeAction);
  }

  public redo(){
    this.store.actionsArchiver.redo();
  }

  public back(){
    this.store.emit(EVENTS.DIAGRAM_BACK, {});
  }

  public openNode(node: Node){
    this.store.emit(EVENTS.DIAGRAM_OPEN_NODE, { node });
  }

  public jumpToNode(node: Node){
    this.store.emit(EVENTS.DIAGRAM_JUMP_TO_NODE, { node });
  }

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

  public addEdge(edge: Edge, isRestore?: boolean){
    edge.store = this.store;
    if(!this.store.addEdge(edge)) return;
    this.store.emit(EVENTS.EDGE_ADDED, { edge, isRestore })
  }

  public activateEdgeDrawer(){
    this.modules.edgeDrawer.activate();
  }

  public deactivateEdgeDrawer(){
    this.modules.edgeDrawer.deactivate();
  }

  public spawnNodeAt(point: Position, node: Node){
    this.addNode(node);
    this.store.emit(EVENTS.DIAGRAM_START_NODE_DRAGGING, {
      node,
      data: point
    })
  }

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

  public simulateCanvasMouseMove(event: MouseEvent){
    this.store.emit(EVENTS.CANVAS_MOUSEMOVE, { sourceEvent: event });
  }

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

  public on(eventType: string, handler: (e: DiagramEvent) => void){
    this.store.on(eventType, handler);
    return this;
  }

  public clearActionsArchiver(){
    this.store.actionsArchiver.clear();
  }


  public getModule(name: string): any{
    return this.modules[name];
  }

}
