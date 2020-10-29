import { ObjectType } from "./ObjectType";

export interface ObjectProps{
  id: number;
  name: string;
  what: ObjectType;
  properties: Object;
}
