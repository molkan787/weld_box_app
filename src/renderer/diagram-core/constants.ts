export const MAIN_ELEMENT = 'main-element';
export const RESIZE_HANDLE = 'resize-handle';
export const HIGHLIGHT_LINE = 'highlight-line';

export const ATTR = Object.freeze({
  CORNER: 'data-corner',
  WALL_SIDE: 'data-wall-side',
});

export const EVENTS = Object.freeze({
  NODE_BBOX_CHANGED: 'node-bbox-changed',
  NODE_DRAGSTART: 'node-dragstart',
  NODE_DRAGGED: 'node-dragged',
  NODE_DROPPED: 'node-dropped',
  NODE_ADDED: 'node-added',
  NODE_DECORATION_CHANGED: 'node-decoration-changed',
  NODE_PARENT_CHANGED: 'node-parent-changed',

  EDGE_CREATED: 'edge-created',
  EDGE_CONNECTIONS_CHANGED: 'edge-connections-changed'
});
