import { EdgeConnection } from "../components/edge-connection";

/**
 * Object containing details of the Edge repositioning request
 */
export interface RepositionRequest{
  subject: EdgeConnection;
  pointTo: EdgeConnection;
}
