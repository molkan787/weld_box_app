import './styles/diagram.less'
import { select, zoom, ZoomTransform, event, interpolateZoom } from 'd3';
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

  readonly store = new DiagramStore(this.options);
  readonly chart: D3Node;
  private nodesLayer: D3Node;
  private edgesLayer: D3Node;

  private zoomTransform?: ZoomTransform;

  private readonly renderer = new Renderer(this.store);

  private readonly modules: any;

  constructor(parentSelector: string, public readonly options: DiagramOptions){
    const { width, height, chartClasses } = options;

    this.modules = {
      nodeDragging: new NodeDragging(this.store),
      treeManager: new TreeManager(this.store),
      edgeDrawer: new EdgeDrawer(this.store)
    }

    this.store.on(EVENTS.EDGE_CREATED, ({edge}: DiagramEvent) => this.addEdge(<Edge>edge));

    // Initializing d3 chart
    const chart = select(parentSelector)
      .append('div')
      .classed('diagram', true)
      .attr('style', `width:${width}px;height:${height}px`)
    if(chartClasses) chart.classed(chartClasses, true);

    const { x, y } = (<HTMLElement>chart.node()).getBoundingClientRect();
    this.store.setCanvasOffset({ x, y });

    this.store.setRootElement(chart);

    this.edgesLayer = chart.append('svg')
                            .attr('width', width)
                            .attr('height', height)
                            .append('g')

    this.nodesLayer = chart.append('div');


    const _zoom = zoom()
    .extent([[0, 0], [width, height]])
    .scaleExtent([0.1, 4])
    .on('zoom', payload => this.zoomed(payload))
    // .filter((e: any) => e.type !== 'wheel' || e.ctrlKey)

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
    node.store = this.store;
    this.store.addNode(node);
    this.store.emit(EVENTS.NODE_ADDED, { node })
    console.log(node)
  }

  public addEdge(edge: Edge){
    this.store.emit(EVENTS.EDGE_ADDED, { edge })
    // this.renderer.build(this.edgesLayer, edge);
  }

  public activateEdgeDrawer(){
    // Temporary solution
    this.store.nodeDraggingTool = false;
  }

  public deactivateEdgeDrawer(){
    // Temporary solution
    this.store.nodeDraggingTool = true;
  }

  public createNodeAt(point: Position, nodeClass: typeof Node){
    const width = 240, height = 120;
    let { x, y } = point;
    if(this.zoomTransform) [x, y] = this.zoomTransform.invert([x, y]);
    x -= width / 2;
    y -= height / 2;
    const node = new nodeClass({ x, y }, { width, height, radius: 0 });
    setTimeout(() => this.addNode(node), 0);
    return node;
  }

  private zoomed({ transform }: any) {
    transform.toString2 = function (){
      return "translate(" + this.x + "px," + this.y + "px) scale(" + this.k + ")";
    }
    this.nodesLayer.attr('style', 'transform:' + transform.toString2());
    this.edgesLayer.attr('transform', transform);
    this.zoomTransform = transform;
    this.store.setZoomTransform(transform);
  }

}
