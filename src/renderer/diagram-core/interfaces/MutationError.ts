import { Component } from "../components/component";

export interface MutationError{
  type: string;
  reason: string;
  component: Component;
}
