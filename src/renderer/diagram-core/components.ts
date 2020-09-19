// import { D3Node } from "./types/aliases";

// export enum NodeType{
//   Rectangle,
//   Circle
// }

// export class Node{

//   readonly edges: Edge[];
//   private _d3Node?: D3Node;

//   constructor(readonly type: NodeType, readonly data: any){
//     this.edges = [];
//   }

//   public setD3Node(d3node: D3Node){
//     this._d3Node = d3node;
//   }

//   public get d3Node(){
//     return this._d3Node;
//   }

// }

// export class Edge{

//   constructor(readonly d3Node: D3Node, readonly data: any){
//   }

//   private _source?: Node;
//   private _destination?: Node;

//   public setSource(node: Node){
//     this._source = node;
//   }

//   public setDestination(node: Node){
//     this._destination = node;
//   }

//   public get source(){
//     return this._source;
//   }

//   public get destination(){
//     return this._destination;
//   }

// }
