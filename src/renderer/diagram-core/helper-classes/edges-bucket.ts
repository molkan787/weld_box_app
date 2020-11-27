import { Edge } from "../components/edge";

export class EdgesBucket{

  private hashmap: Map<number, Edge> = new Map();

  public add(edges: Edge[]){
    const m = this.hashmap;
    for(let i = 0; i < edges.length; i++){
      const edge = edges[i];
      m.set(edge.id, edge);
    }
  }

  public getAll(): Edge[]{
    return Array.from(this.hashmap.values());
  }

}
