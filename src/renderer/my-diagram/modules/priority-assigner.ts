import { EVENTS, MODULES, Node } from "../../diagram-core";
import { DiagramStore } from "../../diagram-core/diagram-store";
import { DiagramEvent } from "../../diagram-core/interfaces/DiagramEvent";
import { DiagramModule } from "../../diagram-core/module";
import { MyEdge } from "../my-edge";
import { MY_EVENTS } from "../my-events";
import { State } from "../state";

/**
 * This module handles the process of assigning priorities to Edges and Childs of a parallel State
 */
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

  /**
   * When user change priority of an edge, adjust the priority of other edges that start from the same source node
   * @param event
   */
  private onEdgePriorityChangedByUser(event: DiagramEvent){
    const edge = <MyEdge>event.edge;
    const prevPriority = <number>event.data;
    this.edgePriorityChanged(edge, prevPriority);
  }


  /**
   * Auto assign priority of a new created Edge
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

  /**
   * When user change delete an edge, adjust the priority of other edges that start from the same source node
   * @param event
   */
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

  /**
   * Adjusts edges priorities based on change of a single edge priority
   * @param edge The edge that its priority changed (the static priority)
   * @param prevPriority The old priority of the provided edge
   */
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

  /**
   * Returns all edges that have the same source Node as the provided Edge `refEdge`
   * @param refEdge
   */
  private getSameSourceEdges(refEdge: MyEdge): MyEdge[]{
    const srcNode = refEdge.source.node;
    if(srcNode){
      return this.getNodeSourceEdges(srcNode);
    }else{
      return [];
    }
  }

  /**
   * Returns all source edge of the Specified Node (source edges all the edge that start from that Node)
   * @param node The node to get its edges
   */
  private getNodeSourceEdges(node: Node){
    return node.edges
      .filter(ec => ec.isSource() && !ec.isBridge)
      .map(ec => <MyEdge>ec.edge);
  }

//#endregion

//#region States

  /**
   * Adjusts priorities of childs States of both the old and new parent of the state that changed parent
   * @param event
   */
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

  /**
   * Adjusts priorities of deleted State's siblings
   * @param event
   */
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

  /**
   * When user change the priority of a State, adjusts the priorities of his siblings States
   * @param event
   */
  private onNodePriorityChangedByUser(event: DiagramEvent){
    const state = <State>event.node;
    const prevPriority = <number>event.data;
    this.statePriorityChanged(state, prevPriority);
  }

  /**
   * Adjusts States priorities based on change of a single State priority,
   * in other words, its adjust priorities of the provided State's siblings (the states that share the same parent as the provided in State)
   * @param state The State than changed its priority
   * @param prevPriority The old priority of the provided State
   */
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

  /**
   * Adjusts priorities of removed State's siblings (when a state was removed from its parent)
   * @param state
   * @param parent
   */
  private stateRemovedFromState(state: State, parent: State){
    const priority = state.properties.priority;
    const oldSiblings = <State[]>parent.children;
    const oldHigher = oldSiblings.filter(os => os.properties.priority > priority);
    this.adjustStatesPriority(oldHigher, -1);
  }

  /**
   * Adjusts priorities of childs of the new parent of the Specified State
   * (when a state was added to a new parent, adjust the priorities of of that new parent's childs)
   * @param state
   */
  private stateAddedToState(state: State){
    const siblings = this.getStateSiblings(state);
    const priorities = siblings.map(s => s.properties.priority);
    const highest = Math.max(...priorities, 0);
    state.properties.priority = highest + 1;
    state.propsArchiver.flush('properties');
  }

  /**
   * Add a specified number to priority of all of the specified States
   * @param states
   * @param by
   */
  private adjustStatesPriority(states: State[], by: number){
    for(let state of states){
      state.properties.priority += by;
      state.propsArchiver.flush('properties');
    }
  }

  /**
   * Returns all States that share the same parent as the specified State
   * @param state
   */
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
