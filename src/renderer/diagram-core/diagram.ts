import './styles/diagram.less'
import { select, zoom } from 'd3';
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

/**
 * `Diagram`
 * The main tasks it do is initiating modules and injecting them a `Store` instance for a shared state and events stream
 */
export class Diagram{

  readonly store = new DiagramStore();
  readonly chart: D3Node;
  private rootNode: D3Node;

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
      .attr('height', height);
    if(chartClasses) chart.classed(chartClasses, true);

    this.rootNode = chart.append('g');

    chart.call(
      // @ts-ignore : (Probably) Neccessary because d3.zoom lib types does not extend d3 types
      zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.1, 4])
        .on('zoom', payload => this.zoomed(payload))
    )

    this.chart = chart;
    this.renderer.setRootNode(this.rootNode);
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
    this.renderer.build(this.rootNode, edge);
  }

  private zoomed({transform}: any) {
    this.rootNode.attr("transform", transform);
  }

}
