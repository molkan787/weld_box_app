import { Node } from "../components/node";
import { MAIN_ELEMENT, RESIZE_HANDLE } from "../constants";
import { D3Node, D3NodesMap } from "../types/aliases";

export class NodeRenderer{

  constructor(readonly d3NodesMap: D3NodesMap){}

  build(container: D3Node, node: Node){
    const g = container.append('g');

    g.append('rect')
      .classed(MAIN_ELEMENT, true)
      .attr('fill', '#EBEBEB')
      .attr('stroke', '#3A3A3A')
      .attr('rx', 5)
      .attr('ry', 5);

    g.append('circle')
      .classed(RESIZE_HANDLE, true)
      .attr('r', 4)
      .attr('fill', '#333')

    g.data([node]);

    this.d3NodesMap.set(node.id, g);
    this.update(node);
  }

  update(node: Node){
    const d3Node = this.d3NodesMap.get(node.id);
    if(typeof d3Node === 'undefined') return;

    const { position: pos, size } = node;
    const { width, height } = size;

    d3Node.attr('transform', `translate(${pos.x},${pos.y})`);

    d3Node.select('rect')
    .attr('width', width)
    .attr('height', height)

    d3Node.select('.' + RESIZE_HANDLE)
      .attr('cx', width)
      .attr('cy', height)
  }

}
