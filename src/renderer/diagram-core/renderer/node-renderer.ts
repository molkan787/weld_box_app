import { select } from "d3";
import { Node } from "../components/node";
import { ATTR, EVENTS, CLASSES } from "../constants";
import { DiagramStore } from "../diagram-store";
import { Corner, GetRectangleCornerPosition, Side } from "../helpers/geometry";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { Position } from "../interfaces/Position";
import { Size } from "../interfaces/Size";
import { D3Node } from "../types/aliases";
import { cs } from "./utils";

const HEADER_HEIGHT = 30;

export class NodeRenderer{

  constructor(readonly store: DiagramStore){
    store.on(EVENTS.NODE_DECORATION_CHANGED, ({ node }: DiagramEvent) => this.updateDecoration(<Node>node))
    store.on(EVENTS.NODE_PARENT_CHANGED, ({ node }: DiagramEvent) => this.updateNodeParent(<Node>node))
  }

  build(container: D3Node, node: Node){
    const g = container.append('g');

    g.data([node]);

    g.classed('node', true)
      .append('rect')
      .classed(CLASSES.MAIN_ELEMENT, true);

    const header = g.append('g').classed('header', true);
    header.append('rect')
            .classed(CLASSES.HEADER_BG, true)
            .attr('height', HEADER_HEIGHT);

    header.append('text')
            .classed(CLASSES.HEADER_TEXT, true)


    const body = g.append('g')
                    .classed(CLASSES.NODE_BODY, true);
    // body.append('foreignObject')
    //       .attr('x', 0)
    //       .attr('y', 30)
    //       .attr('width', 350)
    //       .attr('height', 200)
    //       .append('xhtml:input')
    //         .text('foo')


    this.addResizeHandles(g, node.id);

    this.store.setD3Node(node.id, g);
    this.update(node);

  }

  /** Update node's visual representation */
  update(node: Node){
    this.updateBBox(node);
    this.updateDecoration(node);
    this.updateHeader(node);
  }

  /** Updates element's position in the dom tree,
   * this method need to be called each time Node's parent was changed */
  updateNodeParent(node: Node){
    const parentElement = <HTMLElement>this.getD3Node(node.parent || -1).select(cs(CLASSES.NODE_BODY)).node();
    const element: HTMLElement = this.getD3Node(node).node();
    parentElement.appendChild(element);
    this.updateBBox(node);

    // Drop animation
    element.style.opacity = '0.5';
    setTimeout(() => element.style.opacity = '1', 500);
  }

  updateDecoration(node: Node){
    const d3Node = this.getD3Node(node);

    // Apply outline, usually used when the node is the drop target for a child node
    d3Node.classed('highlighted', node.highlighted);

    // highlight one of node's side, usually used to show attach point when drawing an edge
    let line: D3Node = d3Node.select('.' + CLASSES.HIGHLIGHT_LINE);
    if(node.highlightedWall){
      if(!line.node()) line = d3Node.append('line').classed(CLASSES.HIGHLIGHT_LINE, true);
      const { x1, y1, x2, y2 } = this.getRectWallLineCoords(node.size, node.highlightedWall);
      line
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke-width', 12)
        .attr('stroke', '#1ED76080')
        .attr('cursor', 'grab')
        .attr(ATTR.WALL_SIDE, node.highlightedWall);
    }else{
      line.remove();
    }
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

    d3Node.select(cs(CLASSES.HEADER_BG))
            .attr('width', width)

    const origin: Position = { x: 0, y: 0 };

    const selector = `.${CLASSES.RESIZE_HANDLE}.node-${node.id}`;
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

  private updateHeader(node: Node){
    const d3Node = this.getD3Node(node);
    d3Node.select(cs(CLASSES.HEADER_TEXT))
            .text(node.title);
  }

  private getRectWallLineCoords(size: Size, wall: Side){
    const { width, height } = size;
    if(wall === Side.Top) return { x1: 0, y1: 0, x2: width, y2: 0 };
    else if(wall === Side.Bottom) return { x1: 0, y1: height, x2: width, y2: height };
    else if(wall === Side.Left) return { x1: 0, y1: 0, x2: 0, y2: height };
    else return { x1: width, y1: 0, x2: width, y2: height }; // wall === Side.Right
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
      .classed(CLASSES.RESIZE_HANDLE + ' node-' + nodeId, true)
      .attr('r', 6)
      .attr('fill', 'transparent')
      .attr('cursor', cursor)
      .attr(ATTR.CORNER, corner)
  }

  private getD3Node(node: Node | number): D3Node{
    const id = node instanceof Node ? node.id : node;
    const d3Node = this.store.getD3Node(id);
    return d3Node;
  }

}
