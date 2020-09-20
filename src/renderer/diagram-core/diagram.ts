import './styles/diagram.less'
import { select, zoom } from 'd3';
import { D3Node, D3NodesMap } from './types/aliases';
import { DiagramOptions } from './interfaces/DiagramOptions';
import { NodeDragging } from './interactivity/node-dragging';
import { Node } from './components/node';
import { Renderer } from './renderer/renderer';
import { Edge } from './components/edge';
import { DiagramState } from './diagram-state';

export class Diagram{

  readonly state = new DiagramState();
  readonly chart: D3Node;
  private rootNode: D3Node;

  private readonly renderer = new Renderer(this.state);

  private readonly nodeDragging = new NodeDragging(this.state, this.renderer);

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
      // @ts-ignore : Neccessary because d3.zoom lib types does not extend d3 types
      zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.1, 4])
        .on('zoom', payload => this.zoomed(payload))
    )

    this.chart = chart;
  }


  public addNode(node: Node){
    this.renderer.build(this.rootNode, node);
    this.state.addNode(node);
    this.nodeDragging.apply(node);
  }

  public addEdge(edge: Edge){
    this.renderer.build(this.rootNode, edge);
  }


  private zoomed({transform}: any) {
    this.rootNode.attr("transform", transform);
  }

}
