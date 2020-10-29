import { MyEdge } from "../my-diagram/my-edge";

export class EdgesBucket{

  private hashmap: Map<number, MyEdge> = new Map();

  public add(edges: MyEdge[]){
    const m = this.hashmap;
    for(let i = 0; i < edges.length; i++){
      const edge = edges[i];
      m.set(edge.id, edge);
    }
  }

  public getAll(): MyEdge[]{
    return Array.from(this.hashmap.values());
  }

}
