import { Edge } from "../components/edge";

/**
 * A helper class, used to eliminate duplicate entries
 */
export class EdgesBucket{

  private hashmap: Map<number, Edge> = new Map();

  /**
   * Add egdes to the bucket
   * @param edges Array of edges to add
   */
  public add(edges: Edge[]){
    const m = this.hashmap;
    for(let i = 0; i < edges.length; i++){
      const edge = edges[i];
      m.set(edge.id, edge);
    }
  }

  /**
   * Returns all added edges (without duplicate entries)
   */
  public getAll(): Edge[]{
    return Array.from(this.hashmap.values());
  }

}
