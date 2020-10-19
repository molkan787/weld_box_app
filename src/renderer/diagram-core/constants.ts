export const ATTR = Object.freeze({
  CORNER: 'data-corner',
  WALL_SIDE: 'data-wall-side',
  COMPONENT_ID: 'data-component-id',
});

export const EVENTS = Object.freeze({
  NODE_BBOX_CHANGED: 'node-bbox-changed',
  NODE_DRAGSTART: 'node-dragstart',
  NODE_DRAGGED: 'node-dragged',
  NODE_DROPPED: 'node-dropped',
  NODE_ADDED: 'node-added',
  NODE_DECORATION_CHANGED: 'node-decoration-changed',
  NODE_PARENT_CHANGED: 'node-parent-changed',
  NODE_ATTRS_CHANGED: 'node-attrs-changed',
  NODE_CONTENT_GOT_SHOWN: 'node-content-got-shown',
  NODE_CONTENT_GOT_HIDDEN: 'node-content-got-hidden',
  NODE_GOT_OPEN: 'node-got-open',
  NODE_GOT_CLOSED: 'node-got-closed',
  NODE_CLOSING: 'node-closing',
  NODE_CONTEXT_MENU: 'node-context-menu',
  NODE_DOUBLE_CLICK: 'node-double-click',
  NODE_SELECTED: 'node-selected',

  EDGE_CREATED: 'edge-created',
  EDGE_ADDED: 'edge-added',
  EDGE_CONNECTIONS_CHANGED: 'edge-connections-changed',
  EDGE_CONNECTIONS_UPDATED: 'edge-connections-updated',

  DIAGRAM_EDGE_DRAWER_DISABLED: 'diagram-edge-drawer-disabled',
  DIAGRAM_NODE_DRAGGING_ENABLED: 'diagram-node-dragging-enabled',
  DIAGRAM_OPEN_NODE: 'diagram-open-node',
  DIAGRAM_BACK: 'diagram-back',
  DIAGRAM_ZOOM_CHANGED: 'diagram-zoom-changed',
  DIAGRAM_SET_ZOOM: 'diagram-set-zoom',
  DIAGRAM_DESTROY_EDGES: 'diagram-destroy-edges',
  DIAGRAM_BUILD_EDGES: 'diagram-build-edges',


  INIT_CANVAS_CREATED: 'init-canvas-created'
});

export const CLASSES = Object.freeze({
  ROOT_ELEMENT: 'root-element',
  RESIZE_HANDLE: 'resize-handle',
  HIGHLIGHT_LINE: 'highlight-line',
  HEADER_BG: 'header-bg',
  HEADER_TEXT: 'header-text',
  NODE_BODY: 'node-body',
  CONTENT_HIDDEN: 'content-hidden',
  ATTACH_BOX: 'attach-box',
  SOURCE_ATTACH_BOX: 'source-attach-box',
  TARGET_ATTACH_BOX: 'target-attach-box',
})
