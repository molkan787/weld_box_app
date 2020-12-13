import { select } from "d3";
import { Edge, MultipartEdgeLocation, MultipartEdgeType } from "../components/edge";
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
    store.on(EVENTS.NODE_DECORATION_CHANGED, ({ node }: DiagramEvent) => this.updateDecoration(<Node>node));
    store.on(EVENTS.NODE_PARENT_CHANGED, ({ node }: DiagramEvent) => this.updateNodeParent(<Node>node));
    store.on(EVENTS.NODE_ATTRS_CHANGED, ({ node }: DiagramEvent) => this.updateAttributes(<Node>node));
    // store.on(EVENTS.NODE_GOT_OPEN, ({ node }: DiagramEvent) => this.rebuildAttachBoxes(<Node>node));
    // store.on(EVENTS.NODE_CLOSING, ({ node }: DiagramEvent) => this.rebuildAttachBoxes(<Node>node, true));
    // store.on(EVENTS.NODE_CONTENT_GOT_HIDDEN, e => this.onContentHidded(e));
    // store.on(EVENTS.NODE_CONTENT_GOT_SHOWN, e => this.onContentShown(e));
    store.on(EVENTS.NODE_CONVERTED_TO_SUBCHART,({ node }: DiagramEvent) => this.updateAttributes(<Node>node));
    store.on(EVENTS.NODE_CONVERTED_TO_NORMAL, ({ node }: DiagramEvent) => this.updateAttributes(<Node>node));
    store.on(EVENTS.NODE_SELECTED, (e: DiagramEvent) => this.nodeSelected(e));
    store.on(EVENTS.NODE_DELETED, ({ node }: DiagramEvent) => this.destroyNode(<Node>node));
    store.on(EVENTS.EDGE_ADDED, e => this.onEdgeAdded(e));
    store.on(EVENTS.EDGE_CONVERTED_TO_MULTIPART, e => this.onEdgeConvertedToMultipart(e));
    store.on(EVENTS.EDGE_DELETED, e => this.onEdgeDeleted(e));
    store.on(EVENTS.EDGE_CONNECTIONS_UPDATED, e => this.onEdgeConnectionsUpdated(e));
    store.on(EVENTS.EDGECONNECTION_DESTROYED, e => this.onEdgeConnectionDestroyed(e));
    store.on(EVENTS.EDGECONNECTION_RESTORED, e => this.onEdgeConnectionRestored(e));
  }

  public setLayer(layer: D3Node){
    this.nodesLayer = layer;
  }

  build(container: D3Node, node: Node){
    console.log(`building ${node.name}`)
    const child = node.parent != null;
    const con = child ? container.select(cs(CLASSES.NODE_BODY)) : container;
    const root = con.append('div');
    root.data([node]).classed('node', true);

    let customContentLayer: D3Node | null = null;

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
      customContentLayer = root.append('div').classed('custom-content', true);
    }
    root.classed('circle', node.isCircle)
        .classed(CLASSES.SUB_CHART, node.isSubChart);

    for(let _class of node.classes){
      root.classed(_class, true);
    }

    this.store.setD3Node(node.id, root);
    this.update(node);

    this.buildEdgesAttachBoxes(node, !node.isOpen);

    this.store.emit(EVENTS.NODE_BUILT, { node });

    node.DOMElementBuilt(customContentLayer || root);
  }


  nodeSelected(event: DiagramEvent): void {
    const node = event.node;
    const previous = this.selectedNode;
    this.selectedNode = node || null;
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
    if(!node.isOpen){
      const d3Node = this.getD3Node(node);
      d3Node.classed(CLASSES.CONTENT_HIDDEN, !node.showContent);
      d3Node.classed(CLASSES.SUB_CHART, node.isSubChart);
    }
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
    if(!d3Node) return;

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

  onContentShown(e: DiagramEvent){
    setTimeout(() => {
      this.rebuildAttachBoxes(<Node>e.node, false);
    }, 1);
  }

  onContentHidded(e: DiagramEvent){
    this.rebuildAttachBoxes(<Node>e.node, true);
  }

  onEdgeAdded(e: DiagramEvent){
    const edge = <Edge>e.edge;
    this.buildPotentialAttachBox(edge);
  }

  onEdgeConvertedToMultipart(e: DiagramEvent){
    const edge = <Edge>e.edge;
    this.buildPotentialAttachBox(edge);
  }

  onEdgeDeleted(e: DiagramEvent){
    const edge = <Edge>e.edge;
    this.destroyPotantialAttachBox(edge.source);
    this.destroyPotantialAttachBox(edge.target);
  }

  onEdgeConnectionDestroyed(e: DiagramEvent){
    this.destroyPotantialAttachBox(e.data);
  }

  onEdgeConnectionRestored(e: DiagramEvent){
    this.buildPotentialAttachBox(e.data.edge);
  }

  onEdgeConnectionsUpdated(e: DiagramEvent){
    const edge = <Edge>e.edge;
    if(edge.isMultipart){
      const { source, target } = edge;
      if(source.attachType == AttachType.NodeBody) this.updateEdgeAttachBoxPosition(source);
      if(target.attachType == AttachType.NodeBody) this.updateEdgeAttachBoxPosition(target);
    }
  }

  buildPotentialAttachBox(edge: Edge){
    if(
      edge.multipartType == MultipartEdgeType.Starting &&
      edge.multipartLocation == MultipartEdgeLocation.Inner
    ){
      const target = edge.target;
      const node = target.node;
      if(node?.props.isOpen){
        const container = this.getD3Node(node);
        this.buildEdgeAttachBox(node, container, target, true);
      }
    }
  }

  destroyPotantialAttachBox(ec: EdgeConnection){
    const selector = this.getAttachSelector(ec);
    select(selector).remove();
  }

  getAttachSelector(attachbox: EdgeConnection){
    return `.${CLASSES.ATTACH_BOX}[${ATTR.COMPONENT_ID}="${attachbox.id}"]`;
  }

  rebuildAttachBoxes(node: Node, innerEdgesOnly: boolean = false){
    this.destoryEdgesAttachBoxes(node);
    this.buildEdgesAttachBoxes(node, innerEdgesOnly);
  }

  /** Destorys attach box of all edges of the specified node */
  destoryEdgesAttachBoxes(node: Node){
    if(node.isCircle) return;
    const container = this.getD3Node(node);
    let selector = `.node-${node.id}-${CLASSES.ATTACH_BOX}`;
    container.selectAll(selector).remove();
  }

  /** Build edge target box */
  buildEdgesAttachBoxes(node: Node, innerEdgesOnly: boolean = false){
    if(node.isCircle) return;
    const container = this.getD3Node(node);
    for(const ec of node.edges){
      const edge = <Edge>ec.edge;
      const { isMultipart, multipartLocation, multipartType } = edge;
      const eligible = ec.attachType == AttachType.NodeBody && isMultipart && multipartType == MultipartEdgeType.Starting;
      if(eligible && (!innerEdgesOnly || multipartLocation == MultipartEdgeLocation.Inner)){
        const isInner = edge.multipartLocation == MultipartEdgeLocation.Inner;
        this.buildEdgeAttachBox(node, container, ec, isInner);
      }
    }
  }

  buildEdgeAttachBox(node: Node, container: D3Node, edge: EdgeConnection, isInner: boolean = false){
    let eab: D3Node = select(this.getAttachSelector(edge));
    if(eab.size() == 0){
      eab = container.append('span');
    }
    eab.classed(CLASSES.ATTACH_BOX, true)
        .classed(`node-${node.id}-` + CLASSES.ATTACH_BOX, true)
        .classed('inner', isInner)
        .attr(ATTR.COMPONENT_ID, edge.id);
    this.updateEdgeAttachBoxPosition(edge, eab);
  }

  updateEdgeAttachBoxPosition(ec: EdgeConnection, eab?: D3Node){
    const ab = ec.getInstance();
    if(typeof eab == 'undefined') eab = select(this.getAttachSelector(ab));
    const wall = ab.nodeWall;
    eab.attr(ATTR.WALL_SIDE, wall);
    const node = <Node | null>ab.node;
    if(!node) return;
    const size = node.size, nodePos = node.getAbsolutePosition(true);
    const pad = this.store.diagramOptions.nodeBorderWidth;
    const pos = cloneObject(ab.coordinates);
    const isVertical = wall == Side.Top || wall == Side.Bottom;
    pos.x -= nodePos.x;
    pos.y -= nodePos.y;
    if(isVertical){
      pos.x -= size.width / 2;
      if(wall == Side.Bottom) pos.y -= size.height;
      pos.y -= wall == Side.Top ? pad : -pad;
    }else{
      pos.y -= size.height / 2;
      if(wall == Side.Right) pos.x -= size.width;
      pos.x -= wall == Side.Left ? pad : -pad;
    }
    eab.style('transform', `translate(${pos.x}px,${pos.y}px)`);
  }

  private destroyNode(node: Node){
    const d3node = this.getD3Node(node);
    d3node?.remove();
    console.log('deleted node', node)
  }

  private getD3Node(node: Node | number): D3Node{
    const id = node instanceof Node ? node.id : node;
    const d3Node = this.store.getD3Node(id, true);
    return d3Node;
  }

}
