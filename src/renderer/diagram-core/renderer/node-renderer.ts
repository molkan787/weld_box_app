import { select } from "d3";
import { Node } from "../components/node";
import { ATTR, MAIN_ELEMENT, RESIZE_HANDLE } from "../constants";
import { DiagramStore } from "../diagram-store";
import { Corner, GetRectangleCornerPosition } from "../helpers/geometry";
import { Position } from "../interfaces/Position";
import { D3Node } from "../types/aliases";

export class NodeRenderer{

  constructor(readonly store: DiagramStore){}

  build(container: D3Node, node: Node){
    const g = container.append('g');

    g.append('rect')
      .classed(MAIN_ELEMENT, true)
      .attr('fill', '#EBEBEB')
      .attr('stroke', '#3A3A3A')
      .attr('rx', 8)
      .attr('ry', 8);

    g.data([node]);

    this.addResizeHandles(g);

    this.store.setD3Node(node.id, g);
    this.update(node);
  }

  private addResizeHandles(g: D3Node){
    this.createResizeHandle(g, Corner.TopLeft);
    this.createResizeHandle(g, Corner.TopRight);
    this.createResizeHandle(g, Corner.BottomRight);
    this.createResizeHandle(g, Corner.BottomLeft);
  }

  private createResizeHandle(g: D3Node, corner: Corner){
    const cursor = corner === Corner.TopRight || corner === Corner.BottomLeft
                    ? 'nesw-resize' : 'nwse-resize';
    return g
      .append('circle')
      .classed(RESIZE_HANDLE, true)
      .attr('r', 5)
      .attr('fill', '#0765B6')
      .attr('cursor', cursor)
      .attr(ATTR.CORNER, corner)
  }


  /** Updates node's visual position & size in the canvas */
  update(node: Node){
    const d3Node = this.store.getD3Node(node.id);
    if(typeof d3Node === 'undefined') return;

    const { position: pos, size } = node;
    const { width, height } = size;

    d3Node.attr('transform', `translate(${pos.x},${pos.y})`);

    d3Node.select('rect')
    .attr('width', width)
    .attr('height', height)

    const origin: Position = { x: 0, y: 0 };

    d3Node
      .selectAll('.' + RESIZE_HANDLE)
      .nodes()
      .forEach((n: any) => {
        const d3n = select(n);
        const corner = parseInt(d3n.attr(ATTR.CORNER));
        const pos = GetRectangleCornerPosition(origin, node.size, corner);
        d3n.attr('cx', pos.x).attr('cy', pos.y)
      })

  }

}
