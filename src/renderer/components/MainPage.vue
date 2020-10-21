<template>
  <div class="main-page">
    <TopBar @back-click="backClick" :showBackButton="showBackButton" />
    <div class="middle">
      <SideBar ref="sideBar" :diagram="diagram" @activate-tool="activateTool" @deactivate-tool="deactivateTool" />
      <div ref="canvas" id="canvas"></div>
    </div>
    <StatusBar />
    <PropertiesPanel ref="propsPanel" :object="selectedObject" />
    <ContextMenu ref="menu" />
  </div>
</template>

<script lang="ts">
import SideBar from './SideBar.vue';
import TopBar from './TopBar.vue';
import StatusBar from './StatusBar.vue';
import ContextMenu from './ContextMenu.vue';
import PropertiesPanel from './PropertiesPanel.vue';
import Vue from 'vue';
import { MyDiagram } from '../my-diagram/my-diagram';
import { EVENTS } from '../diagram-core/constants';
import { DiagramEvent } from '../diagram-core/interfaces/DiagramEvent';
import { ObjectProps } from '../my-diagram/interfaces/object-props';
import { ObjectType } from '../my-diagram/interfaces/object-type';
import { Component } from '../diagram-core/components/component';
interface MyData {
  diagram: MyDiagram | null,
  selectedObject: Component | null
}
export default Vue.extend({
  components: {
    SideBar,
    TopBar,
    StatusBar,
    ContextMenu,
    PropertiesPanel
  },
  data: (): MyData => ({
    diagram: null,
    selectedObject: null,
  }),
  computed: {
    showBackButton(){
      return this.diagram && this.diagram.currentNode;
    }
  },
  methods: {
    backClick(){
      this.diagram?.back();
    },
    activateTool(name: string){
      if(name == 'transition'){
        this.diagram?.activateEdgeDrawer()
      }
    },
    deactivateTool(name: string){
      if(name == 'transition'){
        this.diagram?.deactivateEdgeDrawer()
      }
    },
  },
  mounted(){
    this.diagram = new MyDiagram('#canvas');
    this.diagram.buildTestDiagram();

    // @ts-ignore
    this.diagram.on(EVENTS.NODE_CONTEXT_MENU, (e: DiagramEvent) => this.$refs.menu.handle(e))

    this.diagram.on(EVENTS.NODE_SELECTED, ({ node }: DiagramEvent) => this.selectedObject = (node || null));
    this.diagram.on(EVENTS.EDGE_SELECTED, ({ edge }: DiagramEvent) => this.selectedObject = (edge || null));

    // Temporary
    this.diagram.store.on(EVENTS.DIAGRAM_NODE_DRAGGING_ENABLED, () => {
      // @ts-ignore
      this.$refs.sideBar.deactivateTool('transition');
    });

    this.diagram.on(EVENTS.NODE_INITIAL_DROP, (e: DiagramEvent) => {
      const object = <ObjectProps><unknown>e.node;
      if(object.what == ObjectType.Message || object.what == ObjectType.Event){
        e.node?.select();
        (<any>this.$refs.propsPanel).show();
      }
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

  .middle{
    flex: 1;
    display: flex;
    flex-direction: row;
    height: calc(100vh - 70px);
  }

  #canvas{
    background-color: #434343;
  }

}
</style>
