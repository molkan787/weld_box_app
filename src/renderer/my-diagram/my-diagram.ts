import { Diagram, Node } from "../diagram-core";
import { MyEdge } from "./my-edge";
import { State } from "./state";
import { Side } from "../diagram-core/helpers/geometry";
import { ObjectCopier } from "../modules/object-copier";
import { MyObject } from "../interfaces/MyObject";
import { ObjectCrafter } from "../modules/object-crafter";
import { ObjectCopyResult } from "../interfaces/ObjectCopyResult";
import { ComponentType } from "../diagram-core/components/component";

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

  }

  public copySelected(){
    const selected = this.getSelectedComponent();
    if(!selected) return;
    this.clipboard = this.copyComponent(<MyObject>selected);
    this.deselectAll();
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
    this.putNode(node);
    if(edges){
      for(let edge of edges){
        this.addEdge(edge);
      }
    }
  }

  private putNode(node: Node){
    const selected = this.getSelectedComponent();
    if(selected && selected.type === ComponentType.Node){
      (<Node>selected).addChild(node);
    }
    this.addNode(node);
    this.pushNodeAddedAction(node);
  }

  private getSelectedComponent(){
    return this.store.selectedComponent;
  }

  private copyComponent(component: MyObject){
    return this.objectCopier.copy(component);
  }

}
