import './styles/diagram.less'
import { select, zoom } from 'd3';
import { D3Node } from './types/aliases';
import { DiagramOptions } from './interfaces/DiagramOptions';
import { NodeDragging } from './interactivity/node-dragging';
import { Node } from './components/node';
import { Renderer } from './renderer/renderer';
import { Edge } from './components/edge';
import { DiagramStore } from './diagram-store';

/**
 * `Diagram`
 * The main tasks it do is initiating modules and injecting them a `Store` instance for a shared state and events stream
 */
export class Diagram{

  readonly store = new DiagramStore();
  readonly chart: D3Node;
  private rootNode: D3Node;

  private readonly renderer = new Renderer(this.store);

  private readonly nodeDragging = new NodeDragging(this.store);

  constructor(parentSelector: string, options: DiagramOptions){
    const { width, height, chartClasses } = options;

    // Initializing d3 chart
    const chart = select(parentSelector)
      .append('svg')
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
  }


  public addNode(node: Node){
    this.renderer.build(this.rootNode, node);
    this.store.addNode(node);
    this.nodeDragging.apply(node);
  }

  public addEdge(edge: Edge){
    this.renderer.build(this.rootNode, edge);
  }

  private onNodeDragged(event: any, node: Node){
    let overlapingNodes = this.store.getNodesFromPoint({ x: event.x, y: event.y })
    overlapingNodes = overlapingNodes.filter(n => n !== node)
    if(overlapingNodes.length){
      console.log(overlapingNodes)
    }
  }

  private zoomed({transform}: any) {
    this.rootNode.attr("transform", transform);
  }

}
