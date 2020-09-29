<template>
  <div class="main-page">
    <TopBar />
    <div class="middle">
      <SideBar ref="sideBar" @activate-tool="activateTool" @deactivate-tool="deactivateTool" />
      <div ref="canvas" id="canvas"></div>
    </div>
    <StatusBar />
  </div>
</template>

<script lang="ts">
import SideBar from './SideBar.vue';
import TopBar from './TopBar.vue';
import StatusBar from './StatusBar.vue';
import Vue from 'vue'
import { MyDiagram } from '../my-diagram/my-diagram';
import { EVENTS } from '../diagram-core/constants';
interface MyData {
  diagram: MyDiagram | null
}
export default Vue.extend({
  components: {
    SideBar,
    TopBar,
    StatusBar
  },
  data: (): MyData => ({
    diagram: null,
  }),
  methods: {
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
        this.diagram?.createNodeAt({
          x: e.clientX - 40, // -40px because of side bar width (temporary solution)
          y: e.clientY - 40 // -40px because of top bar height (temporary solution)
        })
      }
    }
  },
  mounted(){
    this.diagram = new MyDiagram('#canvas');
    this.diagram.buildTestDiagram();



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
    height: calc(100vh - 60px);
  }

}
</style>
