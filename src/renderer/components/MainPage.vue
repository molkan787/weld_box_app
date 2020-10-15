<template>
  <div class="main-page">
    <TopBar @back-click="backClick" :showBackButton="showBackButton" />
    <div class="middle">
      <SideBar ref="sideBar" @activate-tool="activateTool" @deactivate-tool="deactivateTool" />
      <div ref="canvas" id="canvas"></div>
    </div>
    <StatusBar />
    <ContextMenu ref="menu" />
  </div>
</template>

<script lang="ts">
import SideBar from './SideBar.vue';
import TopBar from './TopBar.vue';
import StatusBar from './StatusBar.vue';
import ContextMenu from './ContextMenu.vue';
import Vue from 'vue';
import { MyDiagram } from '../my-diagram/my-diagram';
import { EVENTS } from '../diagram-core/constants';
import { State } from '../my-diagram/state';
import { DiagramEvent } from '../diagram-core/interfaces/DiagramEvent';
interface MyData {
  diagram: MyDiagram | null
}
export default Vue.extend({
  components: {
    SideBar,
    TopBar,
    StatusBar,
    ContextMenu
  },
  data: (): MyData => ({
    diagram: null,
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
    itemDropped(e: any, itemName: string){
      if(itemName == 'state'){
        const node = this.diagram?.createNodeAt({
          x: e.clientX,
          y: e.clientY - 50 // -40px because of top bar height (temporary solution)
        }, State)
        if(node) node.title = `State ${node.id}`;
      }
    }
  },
  mounted(){
    this.diagram = new MyDiagram('#canvas');
    this.diagram.buildTestDiagram();

    // @ts-ignore
    this.diagram.on(EVENTS.NODE_CONTEXT_MENU, (e: DiagramEvent) => this.$refs.menu.handle(e))

    // Temporary
    this.diagram.store.on(EVENTS.DIAGRAM_NODE_DRAGGING_ENABLED, () => {
      // @ts-ignore
      this.$refs.sideBar.deactivateTool('transition');
    });

    const canvas = <HTMLElement>this.$refs.canvas;

    canvas.addEventListener('dragover', e => e.preventDefault());
    canvas.addEventListener('drop', (e: any) => {
      e.stopPropagation();
      const item = e.dataTransfer.getData('item');
      if(typeof item == 'string' && item.length){
        this.itemDropped(e, item);
      }
    })
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
