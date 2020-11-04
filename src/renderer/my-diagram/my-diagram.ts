import { Diagram, EVENTS, Node } from "../diagram-core";
import { EdgeType, MyEdge } from "./my-edge";
import { State } from "./state";
import { ObjectCopier } from "../modules/object-copier";
import { MyObject } from "../interfaces/MyObject";
import { ObjectCrafter } from "../modules/object-crafter";
import { ObjectCopyResult } from "../interfaces/ObjectCopyResult";
import { Component } from "../diagram-core/components/component";
import { DiagramEvent } from "../diagram-core/interfaces/DiagramEvent";
import { ObjectType } from "../interfaces/ObjectType";

export class MyDiagram extends Diagram{

  private clipboard: ObjectCopyResult | null = null;
  private objectCopier = new ObjectCopier();
  private objectCrafter = new ObjectCrafter();

  constructor(parentSelector: string){
    super(parentSelector, {
      width: window.innerWidth,
      height: window.innerHeight - 70,
      nodeBorderWidth: 3,
      nodeHeaderHeight: 30,
      edgeFactory: (s, t) => {
        const edge = new MyEdge(s, t);
        edge.propsArchiver.lock();
        edge.properties = {
          priority: 0,
          condition: '',
          type: EdgeType.REGULAR
        };
        edge.propsArchiver.unlock();
        return new MyEdge(s, t);
      }
    });
    this.on(EVENTS.NODE_DROPPED, e => this.onNodeDropped(e));
    this.on(EVENTS.EDGE_ADDED, e => this.onEdgeAdded(<MyEdge>e.edge));
  }

  buildInitialDiagram(){
    const state = new State({ x: 140, y: 60 }, { width:750, height: 480, radius: 0 }, { name: 'Thread 1' });

    this.addNode(state);

    state.convertToThread();

  }

  /**
   * Handles EdgeAdded event, To auto assign edge's priority if needed
   * @param edge The `Edge` instance that was added
   */
  private onEdgeAdded(edge: MyEdge){
    const thisSource = edge.source;
    const node = thisSource.node;
    if(node && node.edges.length > 1){
      this.lockActionsArchiver();
      const sources = node.edges.filter(ec => ec.isSource() && ec !== thisSource);
      const sourceEdges = <MyEdge[]>sources.map(ec => ec.edge).filter(e => !!e);
      if(sourceEdges.length == 1){
        const props = sourceEdges[0].properties;
        props.priority == 0 && (props.priority = 1); // if the priority is 0 set it to 1
      }
      const priorities = sourceEdges.map(e => e.properties.priority);
      const highestPriority = Math.max(...priorities);
      edge.properties.priority = highestPriority + 1;
      this.unlockActionsArchiver();
    }
  }

  /**
   * Copy selected object into MyDiagram's  clipboard
   */
  public copySelected(){
    const selected = this.getSelectedComponent();
    if(!selected) return;
    this.clipboard = this.copyObject(<MyObject>selected);
    setTimeout(() => this.deselectAll(), 1);
    console.log(this.clipboard);
  }

  /**
   * Removes selected object and store its copy in MyDiagram's clipboard
   */
  public cutSelected(){
    const selected = this.getSelectedComponent();
    if(!selected) return;
    this.copySelected();
    this.deleteSelectedComponent();
  }

  /**
   * Paste MyDiagram's clipboard's object into the diagram
   */
  public pasteClipboard(){
    if(this.clipboard == null) return;
    const { nodes, edges } = this.objectCrafter.craft(this.clipboard);
    const node = nodes[0];
    node.position = this.store.transformPoint({ x: 50, y: 50 });
    if(this.putNode(node)){
      if(edges){
        for(let edge of edges){
          this.addEdge(edge);
        }
      }
    }
    const len = nodes.length;
    for(let i = len - 1; i >= 0; i--){
      const n = nodes[i];
      if(!n.showContent){
        this.store.emit(EVENTS.NODE_CONTENT_GOT_HIDDEN, { node: n })
      }
    }
  }

  /**
   * Puts a Node in the Diagram's canvas, This method decides where to put the node or if it shouldn't be added
   * @param node Node to be put
   */
  private putNode(node: Node){
    const selected = <MyObject>this.getSelectedComponent();
    const object = <MyObject><any>node;

    if(object.what == ObjectType.Thread){
      if(this.currentNode){
        return;
      }
    }else{
      if(selected && selected.what == ObjectType.State){
        const state = <State>selected;
        if(state.showContent){
          state.addChild(node);
        }
      }
      if(node.parent == null){
        if(this.currentNode){
          this.currentNode.addChild(node);
        }else if(!((<State>node).isThread)){
          return false;
        }
      }
      if(node.parent){
        node.position = { x: 50, y: 50 };
      }
    }

    this.addNode(node);
    this.pushNodeAddedAction(node);
    return true;
  }

  /**
   * Returns the currently selected object on the canvas
   */
  private getSelectedComponent(){
    return this.store.selectedComponent;
  }

  /**
   * Copy Diagram Object's data and visual representation.
   * Returns a Javascript object with the data (not an actual Instance)
   * @param object Object to be copied
   */
  private copyObject(object: MyObject){
    return this.objectCopier.copy(object);
  }


  // ----------------------------------------------

  /**
   * Handles NodeDropped (Drag End) event, To perform changes on it if needed,
   * ex: if `State` was dropped on the canvas, this method will convert it to a `Thread`
   * @param e
   */
  private onNodeDropped(e: DiagramEvent) {
    const node = <Node>e.node;
    const parent = node.parent;

    // if the node was dropped on the canvas we need to perform changes
    if(node != this.currentNode && !parent){

      const object = <MyObject><Component>node;
      if(!this.currentNode && (object.what == ObjectType.State || object.what == ObjectType.Thread)){
        // if there isn't an open node (we are viewing the root diagram)
        // and the dropped object is a State, we convert it to a Thread
        const state = <State>object;
        if(state.isThread) return; // if already is a Thread stop here
        state.convertToThread();
        state.size = { width: 400, height: 300, radius: 0 };
        this.store.emit(EVENTS.NODE_BBOX_CHANGED, { node, sourceEvent: e })
      }else{
        // in all other case just cancel the performed action
        setTimeout(() => this.undo(true), 50);
        setTimeout(() => this.deselectAll(), 10);
      }

    }
  }

}
