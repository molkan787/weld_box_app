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

/**
 * Check if a point is on top of or close to rectangle's wall, and return the wall if there is any
 * @param bbox
 * @param point
 * @param maxDistance
 */
export function TouchesWall(bbox: DOMRect, point: Position, maxDistance: number = 10): Side | null{
  const ds = getPointToBBoxDistances(bbox, point);

  if(Math.abs(ds.top) <= maxDistance) return Side.Top;
  else if(Math.abs(ds.right) <= maxDistance) return Side.Right;
  else if(Math.abs(ds.bottom) <= maxDistance) return Side.Bottom;
  else if(Math.abs(ds.left) <= maxDistance) return Side.Left;

  return null;
}

function getPointToBBoxDistances(bbox: DOMRect, point: Position){
  const { x, y } = point;
  const { top, bottom, right, left } = bbox;
  return {
    top: y - top,
    bottom: y - bottom,
    left: x - left,
    right: x - right
  }
}

  /**
  *
  * @param point Point to check if it is inside the rectangle
  * @param rect The rectangle
  * @param p Padding
  */
  export function isPointInsideBBox(point: Position, rect: DOMRect, p: number){
    const { x, y } = point;
    const { top, left, bottom, right } = rect;
    return (x >= left + p) && (x <= right - p) && (y >= top + p) && (y <= bottom - p);
  }

export function GetRectWallCenterPoint(size: Size, wall: Side){
  const scaleMatrix = _GetRectWallCenterPoint_ScaleMatrices[wall];
  return {
    x: size.width * scaleMatrix.x,
    y: size.height * scaleMatrix.y
  }
}

export function distSqrd(x1: number, y1: number, x2: number, y2: number): number{
  return Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
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

const _GetRectWallCenterPoint_ScaleMatrices = {
  [Side.Top]: {x: 0.5, y: 0},
  [Side.Left]: {x: 0, y: 0.5},
  [Side.Bottom]: {x: 0.5, y: 1},
  [Side.Right]: {x: 1, y: 0.5},
}


export function addPoints(p1: Position, p2: Position): Position{
  return {
    x: p1.x + p2.x,
    y: p1.y + p2.y
  }
}
