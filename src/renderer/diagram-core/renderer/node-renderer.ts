import { AttachType, EdgeConnection } from "../components/edge-connection";
import { Node } from "../components/node";
import { ATTR, EVENTS, CLASSES } from "../constants";
import { DiagramStore } from "../diagram-store";
import { Corner, Side } from "../helpers/geometry";
import { DiagramEvent } from "../interfaces/DiagramEvent";
import { D3Node } from "../types/aliases";
import { cloneObject } from "../utils";
import { cs } from "./utils";

export class NodeRenderer{

  private selectedNode: Node | null = null;
  private nodesLayer: D3Node | null = null;

  constructor(readonly store: DiagramStore){
    store.on(EVENTS.NODE_DECORATION_CHANGED, ({ node }: DiagramEvent) => this.updateDecoration(<Node>node))
    store.on(EVENTS.NODE_PARENT_CHANGED, ({ node }: DiagramEvent) => this.updateNodeParent(<Node>node))
    store.on(EVENTS.NODE_ATTRS_CHANGED, ({ node }: DiagramEvent) => this.updateAttributes(<Node>node))
    store.on(EVENTS.NODE_GOT_OPEN, ({ node }: DiagramEvent) => this.buildEdgesAttachBoxes(<Node>node));
    store.on(EVENTS.NODE_CLOSING, ({ node }: DiagramEvent) => this.destoryEdgesAttachBoxes(<Node>node));
    store.on(EVENTS.NODE_SELECTED, ({ node }: DiagramEvent) => this.nodeSelected(<Node>node));
  }

  public setLayer(layer: D3Node){
    this.nodesLayer = layer;
  }

  build(container: D3Node, node: Node){
    const child = node.parent != null;
    const con = child ? container.select(cs(CLASSES.NODE_BODY)) : container;
    const root = con.append('div');
    root.data([node]).classed('node', true);

    if(node.isBasic){
      root.classed('basic', true);
    }else{
      root.append('div').classed('header', true);
      root.append('div').classed(CLASSES.NODE_BODY, true);
      root.append('svg')
            .attr('id', this.getSVGLayerId(node))
            .classed('svg-layer', true)
            .append('g');

      this.addResizeHandles(root, node.id);
    }

    this.store.setD3Node(node.id, root);
    this.update(node);

    node.DOMElementBuilt(root);
  }


  nodeSelected(node: Node): void {
    const previous = this.selectedNode;
    this.selectedNode = node;
    if(previous){
      this.store.emit(EVENTS.NODE_DECORATION_CHANGED, { node: previous });
    }
    if(node){
      this.store.emit(EVENTS.NODE_DECORATION_CHANGED, { node });
    }
  }

  /** Update node's visual representation */
  update(node: Node){
    this.updateAttributes(node);
    this.updateBBox(node);
    this.updateDecoration(node);
    // this.updateHeader(node);
  }

  updateAttributes(node: Node){
    const d3Node = this.getD3Node(node);
    d3Node.classed(CLASSES.CONTENT_HIDDEN, !node.showContent);
  }

  /** Updates element's position in the dom tree,
   * this method need to be called each time Node's parent was changed */
  updateNodeParent(node: Node){
    const parentElement = <HTMLElement>(
      node.parent ? this.getD3Node(node.parent).select(cs(CLASSES.NODE_BODY))
                  : <D3Node>this.nodesLayer
    ).node();

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
    d3Node.classed('selected', this.selectedNode === node);

    // highlight one of node's side, usually used to show attach point when drawing an edge
    let line: D3Node = d3Node.select(cs(CLASSES.HIGHLIGHT_LINE));
    if(node.highlightedWall){
      if(!line.node()) line = d3Node.append('span').classed(CLASSES.HIGHLIGHT_LINE, true);
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

    if(!node.showContent) return;
    const ap = node.getAbsolutePosition();
    const svgGroup = d3Node.select(this.getSVGGroupSelector(node));
    svgGroup.attr('transform', `translate(${-ap.x}, ${-ap.y})`)
  }

  public getSVGGroupSelector(node: Node){
    return `#${this.getSVGLayerId(node)} g`
  }

  public getSVGLayerId(node: Node){
    return `node-${node.id}-svg-layer`
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

  /** Destorys attach box of all edges of the specified node */
  destoryEdgesAttachBoxes(node: Node){
    const container = this.getD3Node(node);
    const selector = `.node-${node.id}-` + CLASSES.ATTACH_BOX;
    container.selectAll(selector).remove();
  }

  /** Build edge target box */
  buildEdgesAttachBoxes(node: Node){
    const container = this.getD3Node(node);
    for(const edge of node.edges){
      if(edge.attachType === AttachType.NodeBody && !edge.isBridge){
        this.buildEdgeAttachBox(node, container, edge);
      }
    }
  }

  buildEdgeAttachBox(node: Node, container: D3Node, edge: EdgeConnection){
    const wall = edge.nodeWall;
    const eab = container.append('span');
    eab.classed(CLASSES.ATTACH_BOX, true)
        .classed(`node-${node.id}-` + CLASSES.ATTACH_BOX, true)
        .attr(ATTR.WALL_SIDE, wall)
        .attr(ATTR.COMPONENT_ID, edge.id);

    if(edge.offset){
      const pos = cloneObject(edge.offset);
      const isVertical = wall == Side.Top || wall == Side.Bottom;
      if(isVertical){
        pos.y *= -1
      }else{
        pos.x *= -1;
      }
      eab.style('transform', `translate(${pos.x}px,${pos.y}px)`);
    }
  }

  private getD3Node(node: Node | number): D3Node{
    const id = node instanceof Node ? node.id : node;
    const d3Node = this.store.getD3Node(id);
    return d3Node;
  }

}
