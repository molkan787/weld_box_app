import { drag, select } from 'd3';
import { Edge } from '../components/edge';
import { Node } from '../components/node';
import { ATTR, RESIZE_HANDLE } from '../constants';
import { Corner, GetRectangleCornerPosition, Side } from '../helpers/geometry';
import { Renderer } from '../renderer/renderer';
import { D3Node, D3NodesMap } from '../types/aliases';

export class NodeDragging{

  private resizing: boolean = false;
  private resizeCorner: Corner = Corner.TopLeft;

  constructor(
    readonly d3NodesMap: D3NodesMap,
    readonly renderer: Renderer
  ){}

  apply(node: Node){
    const d3Node = this.d3NodesMap.get(node.id);
    if(typeof d3Node === 'undefined'){
      throw new Error(`Node #${node.id} was not found in D3NodesMap`);
    }

    const _drag = drag()
    // if the event comes from resize handle use Node's Size as start point otherwise the position
    // .subject((event: any) => this.getDragStartOrigin(node, event))
    .on('start', (event: any) => this.dragstarted(d3Node, event))
    .on('drag', (event: any, data: any) => this.dragged(d3Node, event, data))
    .on('end', () => this.dragended(d3Node))

    d3Node.call(<any>_drag);
  }

  /** Handler for on drag start */
  dragstarted(d3Node: D3Node, event: any) {

    // if the event comes from resize handle activate resizing mode otherwise deactivate it
    this.resizing = this.isResizeHandleEvent(event);

    if(this.resizing){
      this.resizeCorner = this.getResizeHandleCorner(event);
    }

    // bring the dragged node to the front and change his cursor
    d3Node.raise().attr('cursor', this.resizing ? 'default' : 'move');
  }

  /** handler for dragged */
  dragged(d3Node: D3Node, event: any, node: Node) {
    const { position: pos, size } = node;

    // If we resizing a node, adjust his size and position
    if(this.resizing){
      if(this.resizeCorner & Side.Left){ // Checks if the corner is on the left side
        pos.x += event.dx
        size.width -= event.dx;
      }else{ // corner is on the right side
        size.width += event.dx;
      }
      if(this.resizeCorner & Side.Top){ // Checks if the corner is on the top side
        pos.y += event.dy
        size.height -= event.dy;
      }else{ // corner is on the bottom side
        size.height += event.dy;
      }
      if(size.width < 1) size.width = 1;
      if(size.height < 1) size.height = 1;
    }else{
      pos.x += event.dx;
      pos.y += event.dy;
    }

    this.renderer.update(node);
    this.updateNodeRelations(node);
  }

  /** handler for drag end */
  dragended(d3Node: D3Node) {
    d3Node.attr('cursor', 'default');
  }

  /** Update all elements that relay on the Node's position and/or size */
  updateNodeRelations(node: Node){
    // Casting from (Edge | undefined)[] to Edge[] because undefined cases are already filtered out
    const edges = <Edge[]>(node.edges.map(ec => ec.edge).filter(e => !!e));

    // Updating positions of all edges that are connected to the Node currently being moved
    for(let edge of edges){
      this.renderer.update(edge);
    }
  }

  /** Gets starting position of the drag.
   * Can be Node's position or one of its resize handle's position
   * depending on the element that initiated the drag event
   */
  private getDragStartOrigin(node: Node, event: any){
    if(this.isResizeHandleEvent(event)){
      const corner = this.getResizeHandleCorner(event);
      return GetRectangleCornerPosition(node.position, node.size, corner);
    }else{
      return node.position;
    }
  }

  /** Returns the Corner of the Node at which the event started.
   * This method works and should be used only when the drag event was initiated by a resize handle <circle/>
   */
  private getResizeHandleCorner(event: any): Corner{
    const srcElement = this.getSrcElement(event);
    const d3n = select(srcElement);
    const corner = d3n.attr(ATTR.CORNER);
    return parseInt(corner);
  }

  /** Checks if the event was triggered by the resize handle <circle/> */
  private isResizeHandleEvent(event: any){
    return this.getSrcElement(event)?.classList.contains(RESIZE_HANDLE);
  }

  /** Grabs and return srcElement from the source event */
  private getSrcElement(event: any){
    return event?.sourceEvent?.srcElement;
  }

}
