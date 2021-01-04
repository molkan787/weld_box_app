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

/**
 * This module handles rendering and updating of Node's DOM element and its associated components
 */
export class NodeRenderer{

  private selectedNode: Node | null = null;
  private nodesLayer: D3Node | null = null;

  constructor(readonly store: DiagramStore){
    store.on(EVENTS.NODE_DECORATION_CHANGED, ({ node }: DiagramEvent) => this.updateDecoration(<Node>node));
    store.on(EVENTS.NODE_PARENT_CHANGED, ({ node }: DiagramEvent) => this.updateNodeParent(<Node>node));
    store.on(EVENTS.NODE_ATTRS_CHANGED, ({ node }: DiagramEvent) => this.updateAttributes(<Node>node));
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

  /**
   * Saves reference to Node layer (DOM element) in this module
   * @param layer
   */
  public setLayer(layer: D3Node){
    this.nodesLayer = layer;
  }

  /**
   * Build Node's DOM element on the canvas
   * @param container Parent element
   * @param node Node to built its element
   */
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


  /**
   * Updates decoration (highlight color) of previously selected node and the newly selected one
   * @param event
   */
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

  /**
   * Applies css classes based on Node's attributes
   * @param node
   */
  updateAttributes(node: Node){
    if(!node.isOpen){
      const d3Node = this.getD3Node(node);
      d3Node.classed(CLASSES.CONTENT_HIDDEN, !node.showContent);
      d3Node.classed(CLASSES.SUB_CHART, node.isSubChart);
    }
  }

  /**
   * Updates element's position in the dom tree,
   * this method need to be called each time Node's parent was changed
   */
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

  /**
   * Updates node's styling effects (ex: highlighting color/class)
   * @param node
   */
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

  /**
   * Returns css selector for the specified node's svg/edges layer (each node container and svg layer of edges that containers)
   * @param node
   */
  public getSVGGroupSelector(node: Node){
    return `#${this.getSVGLayerId(node)} g`
  }

  /**
   * Returns id of the specified node's svg/edges layer
   * @param node
   */
  public getSVGLayerId(node: Node){
    return `node-${node.id}-svg-layer`
  }

  /**
   * Builds resize handles (DOM element) for all four corner of the the node
   * @param g The element parent for thus resize handles
   * @param nodeId
   */
  private addResizeHandles(g: D3Node, nodeId: number){
    this.createResizeHandle(g, nodeId, Corner.TopLeft);
    this.createResizeHandle(g, nodeId, Corner.TopRight);
    this.createResizeHandle(g, nodeId, Corner.BottomRight);
    this.createResizeHandle(g, nodeId, Corner.BottomLeft);
  }

  /**
   * Builds resize handle (DOM element) for the specified node's cordner
   * @param g The element parent for this resize handle
   * @param nodeId Node id
   * @param corner Node's corner (where to build the resize handle)
   */
  private createResizeHandle(g: D3Node, nodeId: number, corner: Corner){
    const cursor = corner === Corner.TopRight || corner === Corner.BottomLeft
                    ? 'nesw-resize' : 'nwse-resize';
    return g
      .append('span')
      .classed(CLASSES.RESIZE_HANDLE + ' node-' + nodeId, true)
      .attr(ATTR.CORNER, corner)
      .style('cursor', cursor);
  }

  /**
   * Rebuilds inter-chart attach boxes (connection points) when Node's content (body) got shown
   * @param e
   */
  onContentShown(e: DiagramEvent){
    setTimeout(() => {
      this.rebuildAttachBoxes(<Node>e.node, false);
    }, 1);
  }

  /**
   * Rebuilds inter-chart attach boxes (connection points) when Node's content (body) got hidden
   * @param e
   */
  onContentHidded(e: DiagramEvent){
    this.rebuildAttachBoxes(<Node>e.node, true);
  }

  /**
   * Builds attach box (connection point) when and new inter-chart edge got linked (pass thru) a node
   * @param e
   */
  onEdgeAdded(e: DiagramEvent){
    const edge = <Edge>e.edge;
    this.buildPotentialAttachBox(edge);
  }

  /**
   * Builds attach box (connection point) when an edge linked to (pass thru) a node got convert to a multipart edge
   * @param e
   */
  onEdgeConvertedToMultipart(e: DiagramEvent){
    const edge = <Edge>e.edge;
    this.buildPotentialAttachBox(edge);
  }

  /**
   * Destorys attach boxes (connection points) of an edge when it get deleted (if there was any attach box),
   * In other words, removes attach box that are not needed anymore
   * @param e
   */
  onEdgeDeleted(e: DiagramEvent){
    const edge = <Edge>e.edge;
    this.destroyPotantialAttachBox(edge.source);
    this.destroyPotantialAttachBox(edge.target);
  }

  /**
   * Destorys attach boxes (connection points) of an edge connection when it get destoryed (if there was any attach box),
   * In other words, removes attach box that are not needed anymore
   * @param e
   */
  onEdgeConnectionDestroyed(e: DiagramEvent){
    this.destroyPotantialAttachBox(e.data);
  }

  /**
   * Builds attach box (connection point) of a restored edge connection
   * @param e
   */
  onEdgeConnectionRestored(e: DiagramEvent){
    this.buildPotentialAttachBox(e.data.edge);
  }

  /**
   * Updates attach boxes (connection points) positions when their associated edge connection get update (position changed)
   * @param e
   */
  onEdgeConnectionsUpdated(e: DiagramEvent){
    const edge = <Edge>e.edge;
    if(edge.isMultipart){
      const { source, target } = edge;
      if(source.attachType == AttachType.NodeBody) this.updateEdgeAttachBoxPosition(source);
      if(target.attachType == AttachType.NodeBody) this.updateEdgeAttachBoxPosition(target);
    }
  }

  /**
   * Builds attach boxes for an edge in they are needed
   * @param edge
   */
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

  /**
   * Destorys attach box of an Edge connection if it exist
   * @param ec
   */
  destroyPotantialAttachBox(ec: EdgeConnection){
    const selector = this.getAttachSelector(ec);
    select(selector).remove();
  }

  /**
   * Returns css selecor of EdgeConnection's attach box
   * @param attachbox
   */
  getAttachSelector(attachbox: EdgeConnection){
    return `.${CLASSES.ATTACH_BOX}[${ATTR.COMPONENT_ID}="${attachbox.id}"]`;
  }

  /**
   * Rebuilds inter-chart attach boxes (connection points)
   * @param node The node to rebuilt its attach boxes
   * @param innerEdgesOnly
   */
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

  /**
   * Builds Attch box's DOM element on the containing Node DOM element
   * @param node The node that container the Edge Connection
   * @param container parent DOM element fror the attach box
   * @param edge The Edge Connection to build its attach box
   * @param isInner Indicate whether the attach box should be on the inner side of the node boundries (it should be `true` when the node is not open, and `false` when the node is open as the sub-chart)
   */
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

  /**
   * Updates attach box visual position on the canvas
   * @param ec The associated edge connection
   * @param eab Attach box's DOM element
   */
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

  /**
   * Destory Node's DOM element
   * @param node
   */
  private destroyNode(node: Node){
    const d3node = this.getD3Node(node);
    d3node?.remove();
    console.log('deleted node', node)
  }

  /**
   * Returns D3 selection of Node's DOM element
   * @param node
   */
  private getD3Node(node: Node | number): D3Node{
    const id = node instanceof Node ? node.id : node;
    const d3Node = this.store.getD3Node(id, true);
    return d3Node;
  }

}
