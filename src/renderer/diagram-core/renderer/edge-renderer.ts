import { select } from "d3";
import { Edge } from "../components/edge";
import { AttachType } from "../components/edge-connection";
import { Node } from "../components/node";
import { DiagramStore } from "../diagram-store";
import { D3Node } from "../types/aliases";

export class EdgeRenderer{

  constructor(readonly store: DiagramStore){}

  build(container: D3Node, edge: Edge){
    const line = container.append('line')
      .classed('edge', true)
      .attr('id', 'edge-' + edge.id)
      .attr("stroke-width", 2)
    this.store.setD3Node(edge.id, line);
    this.update(edge);
    this.setupShadows(edge)
  }

  update(edge: Edge){
    const d3Node = this.store.getD3Node(edge.id);
    if(typeof d3Node === 'undefined') return;

    const { source, target } = edge;
    const { x: x1, y: y1 } = source.getCoordinates();
    const { x: x2, y: y2 } = target.getCoordinates();

    d3Node
      .attr('x1', x1)
      .attr('y1', y1)
      .attr('x2', x2)
      .attr('y2', y2)
  }

  setupShadows(edge: Edge){
    this.removeAllShadows(edge);
    const p1 = edge.source?.attachType === AttachType.NodeWall && edge.source?.node?.getTopParent();
    const p2 = edge.target?.attachType === AttachType.NodeWall && edge.target?.node?.getTopParent();
    if(p1) this.createShadow(edge, p1);
    if(p2) this.createShadow(edge, p2);
  }

  createShadow(edge: Edge, node: Node){
    const d3node = this.store.getD3Node(node.id);
    const container = d3node.select('.svg-layer').select('g');
    container
      .append('use')
      .classed(this.getShadowsClass(edge), true)
      .attr('href', '#edge-' + edge.id);
  }

  removeAllShadows(edge: Edge){
    return select('.' + this.getShadowsClass(edge)).remove();
  }

  getShadowsClass(edge: Edge){
    return `edge-${edge.id}-shadow`;
  }

}
