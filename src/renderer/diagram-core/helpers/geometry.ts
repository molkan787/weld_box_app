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

export function movePoint(x: number, y: number, direction: Side, moveBy: number): [number, number]{
  switch (direction) {
    case Side.Top:
      return [x, y - moveBy]
    case Side.Bottom:
      return [x, y + moveBy]
    case Side.Left:
      return [x - moveBy, y]
    case Side.Right:
      return [x + moveBy, y]
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

export enum Direction{
  UP = 1,
  DOWN = -1
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

export function polarToCartesian(r: number, theta: number): Position{
  return {
      x: r * Math.cos(theta),
      y: r * Math.sin(theta)
  }
}

interface UnidimensionalBlock{
  start: number;
  end: number;
  flagged: boolean;
}

export function findEmptySpot(current: number, occupied: number[], minDistance: number, prefferedDirection: Direction, min: number, max: number): number{
  if(minDistance == 0){
    throw new Error('Finding empty spot when minDistance is 0 makes no sense!');
  }
  const hmd = minDistance;
  let blocks: UnidimensionalBlock[] = occupied.map(n => ({ start: n - hmd, end: n + hmd, flagged: false }));
  blocks.push({ start: current - hmd, end: current + hmd, flagged: true });
  blocks = blocks.sort((a, b) => a.start - b.start);
  const subjectIndex = blocks.findIndex(b => b.flagged);
  let moved = moveBlockToEmptySpot(blocks, subjectIndex, prefferedDirection);
  const center = (moved.start + moved.end) / 2;
  if(center < min || center > max){
    moved = moveBlockToEmptySpot(blocks, subjectIndex, prefferedDirection * -1);
  }
  return (moved.start + moved.end) / 2;
}

function moveBlockToEmptySpot(blocks: UnidimensionalBlock[], subjectIndex: number, direction: Direction): UnidimensionalBlock{
  const cond = direction == Direction.UP ? (i: number) => i < blocks.length : (i: number) => i >= 0;
  const inc = direction == Direction.UP ? 1 : -1;
  const { start, end, flagged } = blocks[subjectIndex];
  const subject: UnidimensionalBlock = { start, end, flagged };
  const behind = blocks[subjectIndex + direction * -1];
  behind && moveBlockOverBlock(subject, behind, direction);
  for(let i = subjectIndex + inc; cond(i); i += inc){
    const block = blocks[i];
    moveBlockOverBlock(subject, block, direction);
  }
  return subject;
}

function moveBlockOverBlock(moveable: UnidimensionalBlock, immovable: UnidimensionalBlock, direction: Direction): boolean{
  const { start: x1, end: y1 } = moveable, { start: x2, end: y2 } = immovable;
  const overlaps = (x1 >= x2 && x1 <= y2) || (y1 >= x2 && y1 <= y2)
  if(!overlaps) return false;
  let delta = direction == Direction.UP
                ? immovable.end - moveable.start
                : immovable.start - moveable.end;
  if(Math.sign(delta) != direction) return false;
  delta = (Math.abs(delta) + 1) * Math.sign(delta);
  moveable.start += delta;
  moveable.end += delta;
  return true;
}
