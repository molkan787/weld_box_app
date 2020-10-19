import { Diagram, Edge } from "../diagram-core";
import { Side } from "../diagram-core/helpers/geometry";
import { BasicNode } from "./basic-node";
import { ObjectType } from "./interfaces/object-type";
import { State } from "./state";

export class MyDiagram extends Diagram{

  constructor(parentSelector: string){
    super(parentSelector, {
      width: window.innerWidth,
      height: window.innerHeight - 70,
      nodeBorderWidth: 3,
      nodeHeaderHeight: 30
    });
  }

  buildTestDiagram(){
    const node1 = new State({ x: 80, y: 60 }, { width:750, height: 480, radius: 0 }, { name: 'State 1', showContent: true });
    const node2 = new BasicNode({ x: 20, y: 150 }, ObjectType.Message, { name: 'Child 1' });
    const node3 = new BasicNode({ x: 450, y: 180 }, ObjectType.Event, { name: 'Child 2' });
    node1.addChild(node2);
    node1.addChild(node3);

    // const edge1 = new Edge(node2.createEdgeConnection(Side.Right), node3.createEdgeConnection(Side.Left));

    this.addNode(node1);
    this.addNode(node2);
    this.addNode(node3);

    // this.addEdge(edge1);

    return node2;
  }

}
