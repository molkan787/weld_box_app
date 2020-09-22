<template>
  <div class="main-page">
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Diagram } from '../diagram-core'
import { Edge } from '../diagram-core/components/edge';
import { Node } from '../diagram-core/components/node';
export default Vue.extend({
  mounted(){
    const diagram = new Diagram('.main-page', {
      width: window.innerWidth,
      height: window.innerHeight
    });

    const node1 = new Node({ x: 50, y: 50 }, { width: 120, height: 80, radius: 0 });
    const node2 = new Node({ x: 250, y: 50 }, { width: 120, height: 80, radius: 0 });
    const node3 = new Node({ x: 400, y: 250 }, { width: 120, height: 80, radius: 0 });

    const edge1 = new Edge(node1.createEdgeConnection(), node2.createEdgeConnection());
    const edge2 = new Edge(node1.createEdgeConnection(), node3.createEdgeConnection());

    diagram.addEdge(edge1);
    diagram.addEdge(edge2);

    diagram.addNode(node1);
    diagram.addNode(node2);
    diagram.addNode(node3);
  }
})
</script>
