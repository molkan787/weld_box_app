import './styles/diagram.less'
import { select, zoom, ZoomTransform } from 'd3';
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

/**
 * `Diagram`
 * The main tasks it do is initiating modules and injecting them a `Store` instance for a shared state and events stream
 */
export class Diagram{

  readonly store = new DiagramStore();
  readonly chart: D3Node;
  private rootGroup: D3Node;
  private nodesLayer: D3Node;
  private edgesLayer: D3Node;

  private zoomTransform?: ZoomTransform;

  private readonly renderer = new Renderer(this.store);

  private readonly modules: any;

  constructor(parentSelector: string, options: DiagramOptions){
    const { width, height, chartClasses } = options;

    this.modules = {
      nodeDragging: new NodeDragging(this.store),
      treeManager: new TreeManager(this.store),
      edgeDrawer: new EdgeDrawer(this.store)
    }

    this.store.on(EVENTS.EDGE_CREATED, ({edge}: DiagramEvent) => this.addEdge(<Edge>edge));

    // Initializing d3 chart
    const chart = select(parentSelector)
      .append('svg')
      .classed('diagram', true)
      .attr('width', width)
      .attr('height', height)
      .attr('xmlns:xhtml', 'http://www.w3.org/1999/xhtml');
    if(chartClasses) chart.classed(chartClasses, true);

    const { x, y } = (<SVGSVGElement>chart.node()).getBoundingClientRect();
    this.store.setCanvasOffset({ x, y });

    this.store.setRootElement(chart);

    this.rootGroup = chart.append('g')
    this.edgesLayer = this.rootGroup.append('g');
    this.nodesLayer = this.rootGroup.append('g');

    const _zoom = zoom()
    .extent([[0, 0], [width, height]])
    .scaleExtent([0.1, 4])
    .on('zoom', payload => this.zoomed(payload))

    chart.call(<any>_zoom);

    this.chart = chart;
    this.renderer.setLayers(this.nodesLayer, this.edgesLayer);
  }


  /**
   * Add node to the Diagram, This method need to be called for each New Node in order to be part of the Diagram
   * regardless if the node is child of another node
   * @param node Node instance to add
   */
  public addNode(node: Node){
    this.store.addNode(node);
    this.store.emit(EVENTS.NODE_ADDED, { node })
  }

  public addEdge(edge: Edge){
    this.renderer.build(this.edgesLayer, edge);
  }

  public activateEdgeDrawer(){
    // Temporary solution
    this.store.nodeDraggingTool = false;
  }

  public deactivateEdgeDrawer(){
    // Temporary solution
    this.store.nodeDraggingTool = true;
  }

  public createNodeAt(point: Position){
    const width = 120, height = 60;
    let { x, y } = point;
    if(this.zoomTransform) [x, y] = this.zoomTransform.invert([x, y]);
    x -= width / 2;
    y -= height / 2;
    const node = new Node({ x, y }, { width, height, radius: 0 });
    setTimeout(() => this.addNode(node), 0);
    return node;
  }

  private zoomed({ transform }: any) {
    this.rootGroup.attr("transform", transform);
    this.zoomTransform = transform;
    this.store.setZoomTransform(transform);
  }

}
