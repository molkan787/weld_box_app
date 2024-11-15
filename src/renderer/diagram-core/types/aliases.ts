import { Selection } from 'd3';

/**
 * D3Node is a type alias reffering to D3's selection result (The actual interface to manipulate DOM/SVG elements)
 */
export type D3Node = Selection<any, unknown, HTMLElement, any>;

/**
 * A hashmap for keeping indecies of D3Node by their ids
 */
export type D3NodesMap = Map<number, D3Node>;
