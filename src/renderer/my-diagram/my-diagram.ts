import { Diagram, EVENTS, Node } from "../diagram-core";
import { MyEdge } from "./my-edge";
import { State } from "./state";
import { Side } from "../diagram-core/helpers/geometry";
import { ObjectCopier } from "../modules/object-copier";
import { MyObject } from "../interfaces/MyObject";
import { ObjectCrafter } from "../modules/object-crafter";
import { ObjectCopyResult } from "../interfaces/ObjectCopyResult";
import { Component } from "../diagram-core/components/component";
import { DiagramEvent } from "../diagram-core/interfaces/DiagramEvent";
import { ObjectType } from "../interfaces/ObjectType";
import { DiagramProject } from "../modules/diagram-project";

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
      edgeFactory: (s, t) => new MyEdge(s, t)
    });
    this.on(EVENTS.NODE_DROPPED, e => this.onNodeDropped(e));
  }

  buildTestDiagram(){
    const node1 = new State({ x: 140, y: 60 }, { width:750, height: 480, radius: 0 }, { name: 'State 1', showContent: true });
    const node2 = new State({ x: 20, y: 150 }, { width:200, height: 150, radius: 0 }, { name: 'Child 1' });
    const node3 = new State({ x: 450, y: 180 }, { width:200, height: 150, radius: 0 }, { name: 'Child 2' });
    node1.addChild(node2);
    node1.addChild(node3);

    this.addNode(node1);

    const edge1 = new MyEdge(node2.createEdgeConnection(Side.Right), node3.createEdgeConnection(Side.Left));
    this.addEdge(edge1);

    node1.convertToThread();

  }

  public export(){
    const dp = new DiagramProject();
    console.log(dp.export(this));
  }

  public copySelected(){
    const selected = this.getSelectedComponent();
    if(!selected) return;
    this.clipboard = this.copyComponent(<MyObject>selected);
    setTimeout(() => this.deselectAll(), 1);
    console.log(this.clipboard);
  }

  public cutSelected(){
    const selected = this.getSelectedComponent();
    if(!selected) return;
    this.copySelected();
    this.deleteSelectedComponent();
  }

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

  private getSelectedComponent(){
    return this.store.selectedComponent;
  }

  private copyComponent(component: MyObject){
    return this.objectCopier.copy(component);
  }


  // ----------------------------------------------

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
