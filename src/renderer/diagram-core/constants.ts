/**
 * Diagram's modules names
 */
export const MODULES = Object.freeze({
  NODE_DRAGGING: 'node-dragging',
  INITIAL_NODE_DRAGGING: 'initial-node-dragging',
  EDGE_DRAWER: 'edge-drawer',
  EDGE_RESHAPER: 'edge-reshaper',
  ACTIONS_ARCHIVER: 'actions-archiver',
  COMPONENT_DELETER: 'component-deleted',
  TREE_MANAGER: 'tree-manager',
  INITIAL_EDGE_DRAGGING: 'initial-edge-dragging',
  EDGE_MUTATOR: 'edges-mutator',
});

/**
 * HTML attributes names used for the Diagram systems
 */
export const ATTR = Object.freeze({
  CORNER: 'data-corner',
  WALL_SIDE: 'data-wall-side',
  COMPONENT_ID: 'data-component-id',
  EMIT_DATA: 'data-emit-data',
});

/**
 * Events names for Diagram's systems
 */
export const EVENTS = Object.freeze({
  /** Node's size or position was changed */
  NODE_BBOX_CHANGED: 'node-bbox-changed',
  /** A drag action started on a Node */
  NODE_DRAGSTART: 'node-dragstart',
  /** A node was dragged (moved) */
  NODE_DRAGGED: 'node-dragged',
  /** A drag action ended on a Node */
  NODE_DROPPED: 'node-dropped',
  /** A Node got added to the Diagram */
  NODE_ADDED: 'node-added',
  /** Node's decoration changed (decoration are visual styling, ex: highlighted node have diffrent borders color) */
  NODE_DECORATION_CHANGED: 'node-decoration-changed',
  /** The parent of a Node changed, emitted each time the parent changed */
  NODE_PARENT_CHANGED: 'node-parent-changed',
  /** The parent of a Node changed, emitted only after the drag action ended on the node (means the event isn't emitted when the node temporary had no parent because of free movement on the canvas) */
  NODE_SWITCHED_PARENT: 'node-switched-parent',
  /** Node's attributes changed */
  NODE_ATTRS_CHANGED: 'node-attrs-changed',
  /** Node got converted t a sub-chart */
  NODE_CONVERTED_TO_SUBCHART: 'node-converted-to-subchart',
  /** Emitted before the node gets convert to a sub-chart, allow modules to check if the convertion is possible (and cancel it if necessary) */
  NODE_CONVERTING_TO_SUBCHART: 'node-converting-to-subchart',
  /** Node got converted to a normal node */
  NODE_CONVERTED_TO_NORMAL: 'node-converted-to-normal',
  /** Node's content got shown */
  NODE_CONTENT_GOT_SHOWN: 'node-content-got-shown',
  /** Node's content got hidden */
  NODE_CONTENT_GOT_HIDDEN: 'node-content-got-hidden',
  /** Node got open as a sub-chart */
  NODE_GOT_OPEN: 'node-got-open',
  /** Node got closed */
  NODE_GOT_CLOSED: 'node-got-closed',
  /** Emitted before the node gets closed, allow module to clean stuff */
  NODE_CLOSING: 'node-closing',
  /** A mouse right cliked occured on a Node */
  NODE_CONTEXT_MENU: 'node-context-menu',
  /** A mouse double click occured on a Node  */
  NODE_DOUBLE_CLICK: 'node-double-click',
  /** Node got selected, the event object contains the selected Node (`event.node`), also it may be null in cases of de-selection */
  NODE_SELECTED: 'node-selected',
  /** A node was dragged outside of its parent boundries */
  NODE_DRAGGED_OUT_OF_PARENT: 'node-dragged-out-of-parent',
  /** Emitted when the initial dragging (from toolbox) of node ended */
  NODE_INITIAL_DROP: 'node-initial-drop',
  /** Node got deleted (removed from the diagram) */
  NODE_DELETED: 'node-deleted',
  /** Node's DOM element got built */
  NODE_BUILT: 'node-built',

  /** A new Edge got created by the system */
  EDGE_CREATED: 'edge-created',
  /** An Edge got added to the Diagram */
  EDGE_ADDED: 'edge-added',
  /** Edge's EdgeConnection changed (in most cases their attach type changed) */
  EDGE_CONNECTIONS_CHANGED: 'edge-connections-changed',
  /** Edge's EdgeConnection got updated (in most cases it is emitted because the connected Node was dragged (moved)) */
  EDGE_CONNECTIONS_UPDATED: 'edge-connections-updated',
  /** Edge's decoration changed (visual styling, ex: edge got highlighted) */
  EDGE_DECORATION_CHANGED: 'edge-decoration-changed',
  /** The shape of the Edge got changed by the user */
  EDGE_RESHAPED: 'edge-reshaped',
  /** Edge got selected, the event object contains the selected Edge (`event.edge`), also it may be null in cases of de-selection */
  EDGE_SELECTED: 'edge-selected',
  /** Edge got deleted (removed from the diagram) */
  EDGE_DELETED: 'edge-deleted',
  /** A mouse down event on occured at Edge's end position (the position where it points to) or near to it */
  EDGE_MOUSEDOWN_ON_ENDS: 'edge-mousedown-on-ends',
  /** An regular edge got converted to a multipart edge */
  EDGE_CONVERTED_TO_MULTIPART: 'edge-converted-to-multipart',

  /** Requests a repositioning of an EdgeConnection */
  REPOSITION_EDGECONNECTION: 'reposition-edge-connection',
  /** An EdgeConnection got destoryed (removed from its parent edge) */
  EDGECONNECTION_DESTROYED: 'edge-connection-destroyed',
  /** An EdgeConnection got restored (added back to its parent edge) */
  EDGECONNECTION_RESTORED: 'edge-connection-restored',

  /** The EdgeDrawer module got disable (usefull toggle the site in the toolbox) */
  DIAGRAM_EDGE_DRAWER_DISABLED: 'diagram-edge-drawer-disabled',
  /** The posibility of dragging Nodes git enabled */
  DIAGRAM_NODE_DRAGGING_ENABLED: 'diagram-node-dragging-enabled',
  /** Request to open a specific node */
  DIAGRAM_OPEN_NODE: 'diagram-open-node',
  /** Request to jump to a specific node (same as DIAGRAM_OPEN_NODE) */
  DIAGRAM_JUMP_TO_NODE: 'diagram-jump-to-node',
  /** Request to move back one step in the sub-charts path */
  DIAGRAM_BACK: 'diagram-back',
  /** Canvas's current zoom level changed */
  DIAGRAM_ZOOM_CHANGED: 'diagram-zoom-changed',
  /** Request to sets canvas zoom level */
  DIAGRAM_SET_ZOOM: 'diagram-set-zoom',
  /** Request to destory list of edges (handled only by the Renderer module) */
  DIAGRAM_DESTROY_EDGES: 'diagram-destroy-edges',
  /** Request to build list of edges (handled only by the Renderer module) */
  DIAGRAM_BUILD_EDGES: 'diagram-build-edges',
  /** Sub-charts path changed (breadcrumb) */
  DIAGRAM_CHARTS_PATH_CHANGED: 'diagram-charts-path-changed',
  /** The open sub-chart node changed (another node got open) */
  DIAGRAM_CURRENT_NODE_CHANGED: 'diagram-current-node-changed',

  /** Request to start the process of the Node's initial dragging from the toolbox */
  DIAGRAM_START_NODE_DRAGGING: 'diagram-start-node-dragging',
  /** Request to start the process of the Edge's initial dragging from the toolbox */
  DIAGRAM_START_EDGE_DRAGGING: 'diagram-start-edge-dragging',
  /** Request to delete a Diagram Component (handler) */
  DIAGRAM_DELETE_COMPONENT: 'diagram-delete-component',
  /** The active module changed (the module that has priority in handing events) */
  DIAGRAM_ACTIVE_MODULE_CHANGED: 'diagram-active-module-changed',
  /** Request to restore a removed element (mainly used by ActionsArchiver (Undo/Redo system) ) */
  DIAGRAM_RESTORE_COMPONENT: 'diagram-restore-component',

  /** An error indicating that action (that changes state of diagram components) cannot be done */
  MUTATION_ERROR: 'mutation-error',

  /** Mouse move that occured on the root Diagram's canvas element */
  CANVAS_MOUSEMOVE: 'canvas-mousemove',
  /** Mouse up that occured on the root Diagram's canvas element */
  CANVAS_MOUSEUP: 'canvas-mouseup',
  /** Mouse down that occured on the root Diagram's canvas element */
  CANVAS_MOUSEDOWN: 'canvas-mousedown',

  /** Root diagram's element (canvas) got created */
  INIT_CANVAS_CREATED: 'init-canvas-created'
});

/**
 * HTML/CSS classes used on the diagram
 */
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
  SVG_CLICKABLE: 'svg-clickable',
  EDGES_NOT_CLICKABLE: 'edges-not-clickable',
  HIGHLIGHTED: 'highlighted',
  EDGE_DRAWER_ACTIVE: 'edge-drawer-active',
  DRAGGING: 'dragging',
  SUB_CHART: 'sub-chart',
})

export const DATA_COMMANDS = Object.freeze({
  DESTROY_MULTIPART_INNER_EDGES: 'destroy-bridged-edges',
});

export const MUTATION_ERRORS = Object.freeze({
  CANNOT_CONVERT_NODE_TO_SUBCHART: 'cannot-convert-node-to-subchart',
});

export const MUTATION_ERROR_REASONS = Object.freeze({
  UNRELATED_MUTIPART_EDGE_PASSES_THRU_NODE_WALL: 'unrelated-multipart-edge-passes-thru-node-wall',
})
