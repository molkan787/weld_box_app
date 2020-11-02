<template>
  <div class="main-page">
    <TopBar />
    <div class="middle">
      <SideBar v-show="diagram" ref="sideBar" :diagram="diagram" />
      <div :class="{ hidden: !diagram }" ref="canvas" id="canvas"></div>
      <Welcome v-if="!diagram" />
    </div>
    <StatusBar />
    <Breadcrumb v-if="diagram" @item-click="breadcrumbItemClick" :nodes="chartsPathNodes" />
    <PropertiesPanel v-if="diagram" ref="propsPanel" :object="selectedObject" />
    <ContextMenu ref="menu" />
  </div>
</template>

<script lang="ts">
import SideBar from './SideBar.vue';
import TopBar from './TopBar.vue';
import StatusBar from './StatusBar.vue';
import ContextMenu from './ContextMenu.vue';
import PropertiesPanel from './PropertiesPanel.vue';
import Breadcrumb from './Breadcrumb.vue';
import Welcome from './Welcome.vue';
import Vue from 'vue';
import { EVENTS } from '../diagram-core/constants';
import { DiagramEvent } from '../diagram-core/interfaces/DiagramEvent';
import { ObjectProps } from '../interfaces/ObjectProps';
import { ObjectType } from '../interfaces/ObjectType';
import { Component } from '../diagram-core/components/component';
import { Node } from '../diagram-core';
import { State } from '../my-diagram/state';
import { MyEdge } from '../my-diagram/my-edge';
import { Menu } from '../modules/menu';
import { DataExporter } from '../modules/data-exporter';
import { mapState } from 'vuex';
interface MyData {
  selectedObject: Component & ObjectProps | null,
  chartsPathNodes: (Node | null)[],
  project: any,
}
export default Vue.extend({
  components: {
    SideBar,
    TopBar,
    StatusBar,
    ContextMenu,
    PropertiesPanel,
    Breadcrumb,
    Welcome
  },
  computed: mapState(['diagram']),
  watch: {
    diagram(val){
      val && this.attachEventsHandlers();
    }
  },
  data: (): MyData => ({
    selectedObject: null,
    chartsPathNodes: [null],
    project: null,
  }),
  methods: {
    breadcrumbItemClick(node: Node){
      this.diagram?.jumpToNode(node);
    },
    handleObjectSelected(e: DiagramEvent){
      if(e.type == EVENTS.NODE_SELECTED){
        this.selectedObject = <State>e.node || null;
      }else{
        this.selectedObject = <MyEdge>e.edge || null;
      }
    },
    afterUndoOrRedo(){
      // need to fix reactivity on `MyEdge` instances (Temporary solution)
      if(this.selectedObject?.what == ObjectType.Edge){
        const object = this.selectedObject;
        // @ts-ignore
        this.selectedObject = {};
        this.$nextTick(() => this.selectedObject = object);
      }
    },
    attachEventsHandlers(){
      // @ts-ignore
      this.diagram.on(EVENTS.NODE_CONTEXT_MENU, (e: DiagramEvent) => this.$refs.menu.handle(e))

      this.diagram.on(EVENTS.NODE_SELECTED, (e: DiagramEvent) => this.handleObjectSelected(e));
      this.diagram.on(EVENTS.EDGE_SELECTED, (e: DiagramEvent) => this.handleObjectSelected(e));

      this.diagram.on(EVENTS.DIAGRAM_CHARTS_PATH_CHANGED, (e: DiagramEvent) => this.chartsPathNodes = e.data);

      this.diagram.on(EVENTS.NODE_INITIAL_DROP, (e: DiagramEvent) => {
        const object = <ObjectProps><unknown>e.node;
        if(object.what == ObjectType.Message || object.what == ObjectType.Event){
          e.node?.select();
          (<any>this.$refs.propsPanel).show();
        }
      });
    }
  },
  mounted(){

    Menu
    .on('delete', () => {
      this.diagram?.deleteSelectedComponent();
    })
    .on('undo', () => {
      this.diagram?.undo();
      this.afterUndoOrRedo();
    })
    .on('redo', () => {
      this.diagram?.redo();
      this.afterUndoOrRedo();
    })
    .on('copy', () => {
      this.diagram?.copySelected();
    })
    .on('paste', () => {
      this.diagram?.pasteClipboard();
    })
    .on('cut', () => {
      this.diagram?.cutSelected();
    })
    .on('generate_code', () => {
      const dataExporter = new DataExporter();
      dataExporter.exportData(this.diagram);
    });

  }
})
</script>

<style lang="less" scoped>
.main-page{
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #18191D;

  .middle{
    flex: 1;
    display: flex;
    flex-direction: row;
    height: calc(100vh - 70px);
    .hidden{
      pointer-events: none;
      opacity: 0;
    }
  }

  #canvas{
    background-color: #434343;
  }

}
</style>
