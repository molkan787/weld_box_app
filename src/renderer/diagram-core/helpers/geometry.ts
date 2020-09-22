import { Position } from "../interfaces/Position";
import { Size } from "../interfaces/Size";

/**
 * Calculates the position of a rectangle's corner
 * @param position Position of the rectangle
 * @param size Size of the rectangle
 * @param corner The corner of the rectangle of which the position should be returned
 */
export function GetRectangleCornerPosition(position: Position, size: Size, corner: Corner): Position{
  const { x, y } = position;
  const { width, height } = size;
  // `corner & Side.Right` checks if the Right's bit is present on the corner value (see `Side` enum down below)
  // in result checks of the corner is on the right side.
  // same apply for `corner & Side.Bottom`
  return {
    x: x + (corner & Side.Right ? width : 0),
    y: y + (corner & Side.Bottom ? height : 0)
  }
}

export enum Side{
  Top = 0b0001,
  Left = 0b0010,
  Bottom = 0b0100,
  Right = 0b1000,
}

export enum Corner{
  TopLeft = Side.Top | Side.Left,
  TopRight = Side.Top | Side.Right,
  BottomRight = Side.Bottom | Side.Right,
  BottomLeft = Side.Bottom | Side.Left
}
