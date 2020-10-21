import { ObjectType } from "./object-type";

export interface ObjectProps{
  id: number;
  name: string;
  what: ObjectType;
  properties: Object;
}
