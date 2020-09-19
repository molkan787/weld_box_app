import { Selection } from 'd3';

export type D3Node = Selection<any, unknown, HTMLElement, any>;
export type GraphicNode = Selection<SVGGElement, unknown, HTMLElement, any>;

export type D3NodesMap = Map<number, D3Node>;
