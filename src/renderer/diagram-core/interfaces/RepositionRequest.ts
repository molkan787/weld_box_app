import { EdgeConnection } from "../components/edge-connection";

export interface RepositionRequest{
  subject: EdgeConnection;
  pointTo: EdgeConnection;
}
