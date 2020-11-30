import { EVENTS, Node } from "../../diagram-core";
import { DiagramStore } from "../../diagram-core/diagram-store";
import { DiagramEvent } from "../../diagram-core/interfaces/DiagramEvent";
import { DiagramModule } from "../../diagram-core/module";
import { MyEdge } from "../my-edge";
import { MY_EVENTS } from "../my-events";

export class PriorityAssigner extends DiagramModule{

  constructor(store: DiagramStore){
    super(store, 'priority-assigner');

    store.on(EVENTS.EDGE_CREATED, e => this.onEdgeCreated(e));
    store.on(EVENTS.EDGE_DELETED, e => this.onEdgeDeleted(e));
    store.on(MY_EVENTS.EDGE_PRIORITY_CHANGED_BY_USER, e => this.onEdgePriorityChangedByUser(e));
  }

  private onEdgePriorityChangedByUser(event: DiagramEvent){
    const edge = <MyEdge>event.edge;
    const prevPriority = <number>event.data;
    this.edgePriorityChanged(edge, prevPriority);
  }


  /**
   * Handles EdgeAdded event, To auto assign edge's priority if needed
   * @param edge The `Edge` instance that was added
   */
  private onEdgeCreated(event: DiagramEvent){
    const edge = <MyEdge>event.edge;
    if(edge.properties.priority == 0){
      const otherSources = this.getSameSourceEdges(edge);
      const priorities = otherSources.map(e => e.properties.priority);
      const highest = Math.max(...priorities);
      this.lockActionsArchiver();
      edge.properties.priority = highest + 1;
      this.unlockActionsArchiver();
    }
  }

  private onEdgeDeleted(event: DiagramEvent){
    if(event.isRestore) return;
    const edge = <MyEdge>event.edge;
    const srcNode = <Node>event.data;
    const priority = edge.properties.priority;
    const otherSources = this.getNodeSourceEdges(srcNode);
    const higherEdges = otherSources.filter(e => e.properties.priority > priority);
    this.enableActionGrouping();
    for(let he of higherEdges){
      he.properties.priority -= 1;
      he.propsArchiver.flush('properties');
    }
    this.disableActionGrouping();
  }

  private edgePriorityChanged(edge: MyEdge, prevPriority: number){
    const UP = 1, DOWN = -1;
    const priority = edge.properties.priority;
    if(priority == prevPriority) return;
    const sources = this.getSameSourceEdges(edge);
    const dir = priority > prevPriority ? UP : DOWN;
    let others: MyEdge[];
    if(dir == DOWN){
      others = sources.filter((e) => {
        const ep = e.properties.priority;
        return ep >= priority && ep < prevPriority && e !== edge;
      });
    }else{
      others = sources.filter((e) => {
        const ep = e.properties.priority;
        return ep > prevPriority && ep <= priority && e !== edge;
      });
    }
    edge.propsArchiver.flush('properties');
    this.enableActionGrouping();
    for(let oe of others){
      oe.properties.priority -= dir;
      oe.propsArchiver.flush('properties');
    }
    this.disableActionGrouping();
  }

  private getSameSourceEdges(refEdge: MyEdge): MyEdge[]{
    const srcNode = refEdge.source.node;
    if(srcNode){
      return this.getNodeSourceEdges(srcNode);
    }else{
      return [];
    }
  }

  private getNodeSourceEdges(node: Node){
    return node.edges
      .filter(ec => ec.isSource() && !ec.isBridge)
      .map(ec => <MyEdge>ec.edge);
  }

}
