import { Edge } from "../components/edge";
import { DiagramStore } from "../diagram-store";
import { D3Node } from "../types/aliases";

export class EdgeRenderer{

  constructor(readonly store: DiagramStore){}

  build(container: D3Node, edge: Edge){
    const line = container.append('line')
      .attr("stroke-width", 2)
      .attr("stroke", "black")
    this.store.setD3Node(edge.id, line);
    this.update(edge);
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

}
