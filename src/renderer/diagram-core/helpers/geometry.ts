import { Position } from "../interfaces/Position";
import { Size } from "../interfaces/Size";

export function GetRectangleCornerPosition(position: Position, size: Size, corner: Corner): Position{
  const { x, y } = position;
  const { width, height } = size;
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
