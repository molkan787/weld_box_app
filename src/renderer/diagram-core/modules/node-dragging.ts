import { drag, select } from 'd3';
import { Node } from '../components/node';
import { ATTR, EVENTS, RESIZE_HANDLE } from '../constants';
import { DiagramStore } from '../diagram-store';
import { Corner, Side } from '../helpers/geometry';
import { DiagramEvent } from '../interfaces/DiagramEvent';
import { D3Node } from '../types/aliases';

/**
 * Module thats handles Node Dragging (Moving) and Resizing
 */
export class NodeDragging{

  // Indicate if the current dragging is used to resize the Node
  private resizing: boolean = false;

  // Indicate which corner the user used to resize the Node
  private resizeCorner: Corner = Corner.TopLeft;

  constructor(readonly store: DiagramStore){
    store.on(EVENTS.NODE_ADDED, ({ node }: DiagramEvent) => this.apply(<Node>node))
    store.on(EVENTS.NODE_PARENT_CHANGED, e => this.onNodeParentChanged(e))
  }

  /**
   * Add interactivity capability to the specified Node
   * @param node Node to add interactivity to
   * @description interactivity capability: Dragging/Moving and Resizing
   */
  private apply(node: Node){
    const d3Node = this.store.getD3Node(node.id);
    if(typeof d3Node === 'undefined'){
      throw new Error(`Node #${node.id} was not found in D3NodesMap`);
    }
    // TODO: refactor it, reuse the same functions instances
    // and move events handlers attachement in one global place
    const _drag = drag()
    .on('start', (event: any) => this.dragstarted(d3Node, event, node))
    .on('drag', (event: any) => this.dragged(d3Node, event, node))
    .on('end', (event: any) => this.dragended(d3Node, event, node))

    d3Node.call(<any>_drag);
  }

  /** Handler for on drag start event */
  private dragstarted(d3Node: D3Node, event: any, node: Node) {

    // If NodeDragging Tool is turned off, re-emits drag events for use in other tools
    if(!this.store.nodeDraggingTool){
      this.store.emit(EVENTS.NODE_DRAGSTART, { node, sourceEvent: event});
      return;
    }

    // if the event comes from resize handle than activate resizing mode otherwise deactivate it
    this.resizing = this.isResizeHandleEvent(event);

    if(this.resizing){
      this.resizeCorner = this.getResizeHandleCorner(event);
    }

    // bring the dragged node to the front and change his cursor
    d3Node.raise().attr('cursor', this.resizing ? 'default' : 'move');
  }

  /** handler for dragged event */
  private dragged(d3Node: D3Node, event: any, node: Node) {

    // If NodeDragging Tool is turned off, re-emits drag events for use in other tools
    if(!this.store.nodeDraggingTool){
      this.store.emit(EVENTS.NODE_DRAGGED, { node, sourceEvent: event});
      return;
    }

    const { position: pos, size } = node;

    // If we resizing a node, adjust his size and position
    if(this.resizing){
      const { width, height } = size;

      const left = this.resizeCorner & Side.Left, // checks if the corner is on the left side
            top = this.resizeCorner & Side.Top; // checks if the corner is on the top side

      // adjust the size by deltas change
      size.width += left ? -event.dx : event.dx;
      size.height += top ? -event.dy : event.dy;

      // Cap size to the minimum 1x1
      const minW = 20;
      if(size.width < minW) size.width = minW;
      if(size.height < minW) size.height = minW;

      // adjust node's position if it is being resized from top or left side
      if(left) pos.x -= size.width - width; // adjust x by the diffrence in previous & new width
      if(top) pos.y -= size.height - height; // same here

    }else{
      pos.x += event.dx;
      pos.y += event.dy;
    }

    this.capNodeBBox(node);

    this.store.emit(EVENTS.NODE_BBOX_CHANGED, { node, sourceEvent: event });

    if(!this.resizing){
      this.store.emit(EVENTS.NODE_DRAGGED, { node, sourceEvent: event });
    }
    for(let child of node.children){
      this.store.emit(EVENTS.NODE_BBOX_CHANGED, { node: child, sourceEvent: event });
    }
  }

  /** handler for drag end event */
  private dragended(d3Node: D3Node, event: any, node: Node) {

    // If NodeDragging Tool is turned off, re-emits drag events for use in other tools
    if(!this.store.nodeDraggingTool){
      this.store.emit(EVENTS.NODE_DROPPED, { node, sourceEvent: event});
      return;
    }

    d3Node.attr('cursor', 'default');

    // Updates Node's index in the Spatial Map
    this.store.refreshNode(node);

    this.store.emit(EVENTS.NODE_DROPPED, { node, sourceEvent: event });
  }

  private onNodeParentChanged(event: DiagramEvent){
    const node = <Node>event.node;
    this.capNodeBBox(node);
    this.store.emit(EVENTS.NODE_BBOX_CHANGED, { node, sourceEvent: event });
  }

  private capNodeBBox(node: Node){
    const { parent, position: p, size: s } = node;
    if(parent){
      const ps = parent.size;
      if(p.x < 5) p.x = 5;
      if(p.y < 5) p.y = 5;
      if(s.width > ps.width - 10) s.width = Math.round(ps.width - 10);
      if(s.height > ps.height - 10) s.height = Math.round(ps.height - 10);
      if(p.x + s.width - 5 > ps.width - 10) p.x = Math.round(ps.width - s.width - 5);
      if(p.y + s.height - 5 > ps.height - 10) p.y = Math.round(ps.height - s.height - 5);
    }
  }


  /** Returns the Corner of the Node at which the event started.
   * This method works and should be used only when the drag event was initiated by a resize handle `<circle/>`
   */
  private getResizeHandleCorner(event: any): Corner{
    const srcElement = this.getSrcElement(event);
    const d3n = select(srcElement);
    const corner = d3n.attr(ATTR.CORNER);
    return parseInt(corner);
  }

  /** Checks if the event was triggered by the resize handle `<circle/>` */
  private isResizeHandleEvent(event: any){
    return this.getSrcElement(event)?.classList.contains(RESIZE_HANDLE);
  }

  /** Grabs and return srcElement from the source event */
  private getSrcElement(event: any){
    return event?.sourceEvent?.srcElement;
  }

}
