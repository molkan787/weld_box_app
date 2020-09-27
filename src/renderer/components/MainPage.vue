<template>
  <div class="main-page">
    <SideBar ref="sideBar" @activate-tool="activateTool" @deactivate-tool="deactivateTool" />
    <div ref="canvas" id="canvas"></div>
  </div>
</template>

<script lang="ts">
import SideBar from './SideBar.vue';
import Vue from 'vue'
import { MyDiagram } from '../my-diagram/my-diagram';
import { EVENTS } from '../diagram-core/constants';
interface MyData {
  diagram: MyDiagram | null
}
export default Vue.extend({
  components: {
    SideBar
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
          x: e.clientX - 40,
          y: e.clientY
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
  height: 100%;
  display: flex;
  flex-direction: row;
}
</style>
