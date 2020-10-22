import { Edge } from "../components/edge";
import { EdgeConnection } from "../components/edge-connection";

/**
 * A factory function to create an `Edge` instance
 */
export declare type EdgeInstanceCreator = (source: EdgeConnection, target: EdgeConnection) => Edge;