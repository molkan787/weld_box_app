import { Diagram, Edge } from "../diagram-core";
import { Side } from "../diagram-core/helpers/geometry";
import { MessageNode } from "./MessageNode";
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
    const node1 = new State({ x: 140, y: 60 }, { width:750, height: 480, radius: 0 }, { name: 'State 1', showContent: true });
    const node2 = new MessageNode({ x: 20, y: 150 }, { name: 'Child 1' });
    const node3 = new MessageNode({ x: 450, y: 180 }, { name: 'Child 2' });
    node1.addChild(node2);
    node1.addChild(node3);

    const edge1 = new Edge(node2.createEdgeConnection(Side.Right), node3.createEdgeConnection(Side.Left));

    this.addNode(node1);
    this.addNode(node2);
    this.addNode(node3);

    // setInterval(() => edge1.select(), 0);

    this.addEdge(edge1);
  }

}
