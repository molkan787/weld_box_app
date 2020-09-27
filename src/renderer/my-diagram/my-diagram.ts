import { Diagram, Node, Edge } from "../diagram-core";

export class MyDiagram extends Diagram{

  constructor(parentSelector: string){
    super(parentSelector, {
      width: window.innerWidth,
      height: window.innerHeight
    });
  }

  buildTestDiagram(){
    const node1 = new Node({ x: 50, y: 50 }, { width: 200, height: 160, radius: 0 });
    const node2 = new Node({ x: 350, y: 50 }, { width: 160, height: 120, radius: 0 });
    const node3 = new Node({ x: 400, y: 250 }, { width: 160, height: 120, radius: 0 });
    const node4 = new Node({ x: 700, y: 50 }, { width: 100, height: 60, radius: 0 });
    const node5 = new Node({ x: 700, y: 250 }, { width: 100, height: 60, radius: 0 });
    const node6 = new Node({ x: 700, y: 450 }, { width: 100, height: 60, radius: 0 });


    const edge1 = new Edge(node1.createEdgeConnection(), node2.createEdgeConnection());
    const edge2 = new Edge(node1.createEdgeConnection(), node3.createEdgeConnection());

    this.addEdge(edge1);
    this.addEdge(edge2);

    this.addNode(node1);
    this.addNode(node2);
    this.addNode(node3);
    this.addNode(node4);
    this.addNode(node5);
    this.addNode(node6);
  }

}
