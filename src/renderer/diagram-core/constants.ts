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
  EDGE_ADDED: 'edge-added',
  EDGE_CONNECTIONS_CHANGED: 'edge-connections-changed',

  DIAGRAM_EDGE_DRAWER_DISABLED: 'diagram-edge-drawer-disabled',
  DIAGRAM_NODE_DRAGGING_ENABLED: 'diagram-node-dragging-enabled',

  INIT_CANVAS_CREATED: 'init-canvas-created'
});

export const CLASSES = Object.freeze({
  ROOT_ELEMENT: 'root-element',
  RESIZE_HANDLE: 'resize-handle',
  HIGHLIGHT_LINE: 'highlight-line',
  HEADER_BG: 'header-bg',
  HEADER_TEXT: 'header-text',
  NODE_BODY: 'node-body',
})
