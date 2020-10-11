import { drag, select } from 'd3';
import { Node } from '../components/node';
import { ATTR, EVENTS, CLASSES } from '../constants';
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
    d3Node.raise().style('cursor', this.resizing ? 'default' : 'move');
  }

  /**
   * handler for dragged event.
   * this function will either move the node in the canvas or just resize the node according to mouse movement
   */
  private dragged(d3Node: D3Node, event: any, node: Node) {

    // If NodeDragging Tool is turned off, re-emits drag events for use in other tools
    if(!this.store.nodeDraggingTool){
      this.store.emit(EVENTS.NODE_DRAGGED, { node, sourceEvent: event});
      return;
    }
    let { dx, dy } = event;
    const scale = 1 / (this.store.zoomTransform?.k || 1);
    dx *= scale;
    dy *= scale;
    const { position: pos, size } = node;

    // If we resizing a node, adjust his size and position
    if(this.resizing){
      const { width, height } = size;

      const left = this.resizeCorner & Side.Left, // checks if the corner is on the left side
            top = this.resizeCorner & Side.Top; // checks if the corner is on the top side

      // adjust the size by deltas change
      size.width += left ? -dx : dx;
      size.height += top ? -dy : dy;

      // Cap size to the minimum 1x1
      const minW = 120;
      const minH = 60;
      if(size.width < minW) size.width = minW;
      if(size.height < minH) size.height = minH;

      // adjust node's position if it is being resized from top or left side
      if(left) pos.x -= size.width - width; // adjust x by the diffrence in previous & new width
      if(top) pos.y -= size.height - height; // same here

    }else{
      pos.x += dx;
      pos.y += dy;
    }

    // Skip size capping if the node is current open the canvas as a sub-chart
    if(!node.props.isOpen){
      this.capNodeBBox(node);
    }

    this.store.emit(EVENTS.NODE_BBOX_CHANGED, { node, sourceEvent: event });

    if(this.resizing){
      // caps size & position of any child that exceeds parent's box, only if node's content is visible
      if(node.showContent){
        for(let child of node.children){
          this.capNodeBBox(child)
        }
      }
    }else{
      this.store.emit(EVENTS.NODE_DRAGGED, { node, sourceEvent: event });
    }

  }

  /** handler for drag end event */
  private dragended(d3Node: D3Node, event: any, node: Node) {

    // If NodeDragging Tool is turned off, re-emits drag events for use in other tools
    if(!this.store.nodeDraggingTool){
      this.store.emit(EVENTS.NODE_DROPPED, { node, sourceEvent: event});
      return;
    }

    d3Node.style('cursor', 'default');

    this.store.emit(EVENTS.NODE_DROPPED, { node, sourceEvent: event });
  }

  private onNodeParentChanged(event: DiagramEvent){
    const node = <Node>event.node;
    this.capNodeBBox(node);
    this.store.emit(EVENTS.NODE_BBOX_CHANGED, { node, sourceEvent: event });
  }

  private capNodeBBox(node: Node){
    const { parent, position: p, size: s } = node;
    let changed = false;
    if(parent){
      const ps = parent.size;
      const { top, right, bottom, left } = this.store.nodePadding;
      const extp = 1; // extra padding
      const maxW = ps.width - left - right - extp;
      const maxH = ps.height - top - bottom - extp;

      if(p.x < extp && (changed = true)) p.x = extp;
      if(p.y < extp && (changed = true)) p.y = extp;
      if(s.width > maxW && (changed = true)) s.width = Math.round(maxW);
      if(s.height > maxH && (changed = true)) s.height = Math.round(maxH);
      if(p.x + s.width > maxW && (changed = true)) p.x = Math.round(maxW - s.width);
      if(p.y + s.height > maxH && (changed = true)) p.y = Math.round(maxH - s.height);
    }
    return changed;
  }


  /** Returns the Corner of the Node at which the event started.
   * This method works and should be used only when the drag event was initiated by a resize handle `<span/>`
   */
  private getResizeHandleCorner(event: any): Corner{
    const srcElement = this.getSrcElement(event);
    const d3n = select(srcElement);
    const corner = d3n.attr(ATTR.CORNER);
    return parseInt(corner);
  }

  /** Checks if the event was triggered by the resize handle `<span/>` */
  private isResizeHandleEvent(event: any){
    return this.getSrcElement(event)?.classList.contains(CLASSES.RESIZE_HANDLE);
  }

  /** Grabs and return srcElement from the source event */
  private getSrcElement(event: any){
    return event?.sourceEvent?.srcElement;
  }

}
