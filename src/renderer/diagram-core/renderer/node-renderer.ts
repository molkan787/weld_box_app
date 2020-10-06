import { Node } from "../components/node";
import { ATTR, EVENTS, CLASSES } from "../constants";
import { DiagramStore } from "../diagram-store";
import { Corner, Side } from "../helpers/geometry";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { Size } from "../interfaces/Size";
import { D3Node } from "../types/aliases";
import { cs } from "./utils";

export class NodeRenderer{

  constructor(readonly store: DiagramStore){
    store.on(EVENTS.NODE_DECORATION_CHANGED, ({ node }: DiagramEvent) => this.updateDecoration(<Node>node))
    store.on(EVENTS.NODE_PARENT_CHANGED, ({ node }: DiagramEvent) => this.updateNodeParent(<Node>node))
  }

  build(container: D3Node, node: Node){
    const root = container.append('div');
    root.data([node]).classed('node', true);

    root.append('div').classed(CLASSES.NODE_BODY, true);

    const header = root.append('div').classed('header', true);
    header.append('span')
            .classed(CLASSES.HEADER_TEXT, true)

    this.addResizeHandles(root, node.id);

    this.store.setD3Node(node.id, root);
    this.update(node);

    node.DOMElementBuilt(root);
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
      if(!line.node()) line = d3Node.append('span').classed(CLASSES.HIGHLIGHT_LINE, true);
      // const { x1, y1, x2, y2 } = this.getRectWallLineCoords(node.size, node.highlightedWall);
      line.attr(ATTR.WALL_SIDE, node.highlightedWall);
    }else{
      line.remove();
    }
  }

  /** Updates node's visual position & size in the canvas */
  updateBBox(node: Node){
    const d3Node = this.getD3Node(node)

    const { position: pos, size } = node;
    const { width, height } = size;

    d3Node.style('left', pos.x + 'px')
          .style('top', pos.y + 'px')
          .style('width', width + 'px')
          .style('height', height + 'px');

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
      .append('span')
      .classed(CLASSES.RESIZE_HANDLE + ' node-' + nodeId, true)
      .attr(ATTR.CORNER, corner)
      .style('cursor', cursor);
  }

  private getD3Node(node: Node | number): D3Node{
    const id = node instanceof Node ? node.id : node;
    const d3Node = this.store.getD3Node(id);
    return d3Node;
  }

}
