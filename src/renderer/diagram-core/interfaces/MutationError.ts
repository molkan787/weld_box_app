import { Component } from "../components/component";

/**
 * An error object, containing details of the user action on the diagram object that caused the error or had logic errors
 */
export interface MutationError{
  type: string;
  reason: string;
  component: Component;
}
