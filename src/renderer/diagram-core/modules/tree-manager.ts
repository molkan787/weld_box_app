import { Node } from "../components/node";
import { EVENTS } from "../constants";
import { DiagramStore } from "../diagram-store";
import { DiagramEvent } from "../interfaces/DiagramEvent";

export class TreeManager{

  private dropTarget: Node | null = null;

  constructor(readonly store: DiagramStore){
    store.on(EVENTS.NODE_DRAGGED, e => this.onNodeDragged(e));
    store.on(EVENTS.NODE_DROPPED, e => this.onNodeDropped(e));
  }

  private onNodeDropped(event: DiagramEvent){
    const target = this.dropTarget;
    this.setDropTarget(null);
    if(target){
      target.highlighted = false;
      this.changeNodeParent(event.node, target);
    }
  }

  private onNodeDragged(event: DiagramEvent){
    const { node, sourceEvent } = event;
    if(node.parent) return;
    const { x, y } = sourceEvent;
    let overlapingNodes = this.store.getNodesFromPoint({ x, y });
    overlapingNodes = overlapingNodes.filter(n => n !== node && !n.parent)
    this.setDropTarget(overlapingNodes[0] || null);
  }

  private setDropTarget(node: Node | null){
    if(this.dropTarget === node) return;
    if(this.dropTarget){
      this.dropTarget.highlighted = false;
      this.store.emit(EVENTS.NODE_DECORATION_CHANGED, { node: this.dropTarget });
    }
    this.dropTarget = node;
    if(node){
      node.highlighted = true;
      this.store.emit(EVENTS.NODE_DECORATION_CHANGED, { node });
    }
  }

  private changeNodeParent(node: Node, newParent: Node){
    newParent.addChild(node);
    const pp = newParent.position;
    const cp = node.position;
    cp.x -= pp.x;
    cp.y -= pp.y;
    this.store.emit(EVENTS.NODE_PARENT_CHANGED, { node });
  }

}
