# Application structure

*Code documentation is located at `docs/code`.*
*Note: All file's paths mentioned down below are relative to the `src` directory of the project's root directory.*

The application is divided into two sections:
- The core part (`renderer/diagram-core` directory) which handles base functionality of chart/diagram (rendering, user interaction...).
- The business logic (all remaining files in the `renderer` directory), which extends the core diagram module and adds on top of it business logics (States, Threads, Events...)

## Core part `diagram-core`
Functionalities of this part are divided into modules (`renderer/diagram-core/modules`), that communicates thru a shared event bus and state store `DiagramStore`  (`renderer/diagram-core/diagram-store.ts`).
Rendering modules are a bit diffrence and they are located at `renderer/diagram-core/renderer`.
All modules are initialized by the main entry `Diagram` (`renderer/diagram-core/diagram.ts`) which pass the store instance to to all of thus modules.
This part also contains two building blocks of the chart, `Node` and `Edge`

All events names are defined in `renderer/diagram-core/constants.ts/EVENTS`

#### Module
Module inherits the base class `Module` (`renderer/diagram-core/module.ts`) which contains shortcuts/wrapper of shared systems, for example methods that adds a user action to the stack of Undo/Redo system.
Each module handle specific tasks that are relative to each others, (ex: the NodeDragging module handle moving/dragging and resizing Nodes)

#### Module `ActionsArichiver`
ActionsArichiver is also a module but it is inject into all of remaining module, so access to it is easier.
This module holds user actions history and handle the process of canceling the action (Undo), as wall as restoring the canceled action (Redo).
The exact undo or redo steps are provided by each of the module that handles the particular functionality (ex: NodeDragging module is reponsible for Node dragging and resizing, at the of the drag action this module push the exact undo/redo steps)

#### Building blocks
There are two building blocks `Node` and `Edge` both are classes containing properties that holds their state (position, size, if they are highlighted...)

#### Renderer
The renderer is divided into three parts:
- The main entry that handles general rendering logic (`renderer/diagram-core/renderer/renderer.ts`).
- Node renderer part that handles rendering of Nodes (`renderer/diagram-core/renderer/node-renderer.ts`).
- Edge Renderer that handles rendering of Edges (`renderer/diagram-core/renderer/edge-renderer.ts`).

The diagram's canvas contains two layers:
- First layer is a `div` element which will contain Nodes' elements
- Second layer is an `svg` element which will contain Edges's elements

#### `Node`
Node is renderer as `div` element containing multiple layers, base layer for borders, resize handles..., seconds layer for its childs node, and the last layer for custom content which can be customized via `DOMElementBuilt` hook when it get renderer (see class `Node` in code documentation).

#### `Edge`
Edge is renderer as an svg path, its content also can be customized via `DOMElementBuilt` hook when it get renderer (see class `Edge` in code documentation).

## Business Logic part

The business part extends core functionalities and controls user interface (ToolBox, Properties panel...)

#### Components
All of `State`, `Thread`, `Junction`, `Message` and `Event` are components that extends the core class `Node` and adds its business related functionalities and properties.

#### Custom content rendering
The `Node` and `Edge` core building blocks expose a life cicle hook `DOMElementBuilt` that all of previously mentioned components uses to mount a Vue.js component on the raw DOM element.
The Vue.js components renders and controls all of business related UI (Edge condition, State type indicators, Action Blocks...).

#### Project saving
The saving process start by extracting crucial from all of diagram's components instances to seriazable objects, than it is saved toghther with projects attributes/settings in json string format to a file

#### Project loading
The loading process start by read the project file json string, than using the data to create instances of components, than a new `MyDiagram` instance gets created and all of the components are added to it
