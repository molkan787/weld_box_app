import { select } from "d3";
import { Node } from "../components/node";
import { ATTR, EVENTS, MAIN_ELEMENT, RESIZE_HANDLE } from "../constants";
import { DiagramStore } from "../diagram-store";
import { Corner, GetRectangleCornerPosition } from "../helpers/geometry";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { Position } from "../interfaces/Position";
import { D3Node } from "../types/aliases";

export class NodeRenderer{

  constructor(readonly store: DiagramStore){
    store.on(EVENTS.NODE_DECORATION_CHANGED, ({ node }: DiagramEvent) => this.updateDecoration(node))
    store.on(EVENTS.NODE_PARENT_CHANGED, ({ node }: DiagramEvent) => this.updateNodeParent(node))
  }

  build(container: D3Node, node: Node){
    const g = container.append('g');

    g.classed('node', true)
      .append('rect')
      .classed(MAIN_ELEMENT, true)
      .attr('fill', '#EBEBEB')
      .attr('stroke', '#3A3A3A')
      .attr('rx', 8)
      .attr('ry', 8);

    g.data([node]);

    this.addResizeHandles(g, node.id);

    this.store.setD3Node(node.id, g);
    this.update(node);

  }

  private addResizeHandles(g: D3Node, nodeId: number){
    this.createResizeHandle(g, nodeId, Corner.TopLeft);
    this.createResizeHandle(g, nodeId, Corner.TopRight);
    this.createResizeHandle(g, nodeId, Corner.BottomRight);
    this.createResizeHandle(g, nodeId, Corner.BottomLeft);
  }

  private createResizeHandle(g: D3Node, nodeId: number, corner: Corner){
    const cursor = corner === Corner.TopRight || corner === Corner.BottomLeft
                    ? 'nesw-resize' : 'nwse-resize';
    return g
      .append('circle')
      .classed(RESIZE_HANDLE + ' node-' + nodeId, true)
      .attr('r', 6)
      .attr('fill', '#0765B6')
      .attr('cursor', cursor)
      .attr(ATTR.CORNER, corner)
  }

  /** Update node's visual representation */
  update(node: Node){
    this.updateBBox(node);
    this.updateDecoration(node);
  }

  /** Updates element's position in the dom tree,
   * this method need to be called each time Node's parent was changed */
  updateNodeParent(node: Node){
    const parentElement: HTMLElement = this.getD3Node(node.parent || -1).node();
    const element: HTMLElement = this.getD3Node(node).node();
    parentElement.appendChild(element);
    this.updateBBox(node);

    // Drop animation
    element.style.opacity = '0.5';
    setTimeout(() => element.style.opacity = '1', 500);
  }

  updateDecoration(node: Node){
    const d3Node = this.getD3Node(node);
    d3Node.classed('highlighted', node.highlighted);
  }

  /** Updates node's visual position & size in the canvas */
  updateBBox(node: Node){
    const d3Node = this.getD3Node(node)

    const { position: pos, size } = node;
    const { width, height } = size;

    d3Node.attr('transform', `translate(${pos.x},${pos.y})`);

    d3Node.select('rect')
    .attr('width', width)
    .attr('height', height)

    const origin: Position = { x: 0, y: 0 };

    const selector = `.${RESIZE_HANDLE}.node-${node.id}`;
    d3Node
      .selectAll(selector)
      .nodes()
      .forEach((n: any) => {
        const d3n = select(n);
        const corner = parseInt(d3n.attr(ATTR.CORNER));
        const pos = GetRectangleCornerPosition(origin, node.size, corner);
        d3n.attr('cx', pos.x).attr('cy', pos.y)
      })

  }

  private getD3Node(node: Node | number): D3Node{
    const id = node instanceof Node ? node.id : node;
    const d3Node = this.store.getD3Node(id);
    if(typeof d3Node === 'undefined'){
      throw new Error(`Node #${id} was not found in D3NodesMap`);
    }
    return d3Node;
  }

}
