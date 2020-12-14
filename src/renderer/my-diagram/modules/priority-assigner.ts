import { EVENTS, MODULES, Node } from "../../diagram-core";
import { DiagramStore } from "../../diagram-core/diagram-store";
import { DiagramEvent } from "../../diagram-core/interfaces/DiagramEvent";
import { DiagramModule } from "../../diagram-core/module";
import { MyEdge } from "../my-edge";
import { MY_EVENTS } from "../my-events";
import { State } from "../state";

export class PriorityAssigner extends DiagramModule{

  constructor(store: DiagramStore){
    super(store, 'priority-assigner');

    store.on(EVENTS.EDGE_CREATED, e => this.onEdgeCreated(e));
    store.on(EVENTS.EDGE_DELETED, e => this.onEdgeDeleted(e));
    store.on(MY_EVENTS.EDGE_PRIORITY_CHANGED_BY_USER, e => this.onEdgePriorityChangedByUser(e));

    store.on(EVENTS.NODE_SWITCHED_PARENT, e => this.onNodeSwitchedParent(e));
    store.on(EVENTS.NODE_INITIAL_DROP, e => this.onNodeSwitchedParent(e));
    store.on(EVENTS.NODE_DELETED, e => this.onNodeDeleted(e));
    store.on(MY_EVENTS.NODE_PRIORITY_CHANGED_BY_USER, e => this.onNodePriorityChangedByUser(e));
  }

//#region Edges

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
    const otherSources = srcNode ? this.getNodeSourceEdges(srcNode) : [];
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

//#endregion

//#region Nodes

  private onNodeSwitchedParent(event: DiagramEvent){
    const state = <State>event.node;
    const oldParent = <State | null>event.data;
    const newParent = <State | null>state.parent;

    this.enableActionGrouping();
    if(oldParent){
      this.stateRemovedFromState(state, oldParent);
    }
    if(newParent){
      this.stateAddedToState(state);
    }
    this.disableActionGrouping();

  }

  private onNodeDeleted(event: DiagramEvent){
    const srcEvent = event.sourceEvent;
    // if the sender of the event is the Component deleter,
    // it means that this is a subsequent call (deleting childs of the originally deleted node)
    // and so we should skip handling this event
    if(srcEvent?.sender?.name == MODULES.COMPONENT_DELETER) return;
    const state = <State>event.node;
    const oldParent = <State | null>event.data; // data prop should contain deleted node's parent
    if(oldParent){
      this.enableActionGrouping();
      this.stateRemovedFromState(state, oldParent);
      this.disableActionGrouping();
    }
  }

  private onNodePriorityChangedByUser(event: DiagramEvent){
    const state = <State>event.node;
    const prevPriority = <number>event.data;
    this.statePriorityChanged(state, prevPriority);
  }

  private statePriorityChanged(state: State, prevPriority: number){
    const UP = 1, DOWN = -1;
    const priority = state.properties.priority;
    if(priority == prevPriority) return;
    const siblings = <State[]>(state.parent?.children || [])
    const dir = priority > prevPriority ? UP : DOWN;
    let others: State[];
    if(dir == UP){
      others = siblings.filter(s => {
        const p = s.properties.priority;
        return p > prevPriority && p <= priority && s != state;
      })
    }else{
      others = siblings.filter(s => {
        const p = s.properties.priority;
        return p >= priority && p < prevPriority && s != state;
      })
    }
    state.propsArchiver.flush('properties');
    this.enableActionGrouping();
    this.adjustStatesPriority(others, dir * -1)
    this.disableActionGrouping();
  }

  private stateRemovedFromState(state: State, parent: State){
    const priority = state.properties.priority;
    const oldSiblings = <State[]>parent.children;
    const oldHigher = oldSiblings.filter(os => os.properties.priority > priority);
    this.adjustStatesPriority(oldHigher, -1);
  }

  private stateAddedToState(state: State){
    const siblings = this.getStateSiblings(state);
    const priorities = siblings.map(s => s.properties.priority);
    const highest = Math.max(...priorities, 0);
    state.properties.priority = highest + 1;
    state.propsArchiver.flush('properties');
  }

  private adjustStatesPriority(states: State[], by: number){
    for(let state of states){
      state.properties.priority += by;
      state.propsArchiver.flush('properties');
    }
  }

  private getStateSiblings(state: State): State[]{
    const parent = state.parent;
    if(parent){
      return <State[]>parent.children.filter(c => c !== state);
    }else{
      return [];
    }
  }

//#endregion

}
