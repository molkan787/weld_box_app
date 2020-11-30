<template>
  <BaseForm :object="edge" :showNameField="!isStart" :objectType="isStart ? 'Start Edge' : 'Edge'">

    <template v-if="!isStart">
      <FormField label="Priority">
        <input @input="priorityInput" :value="edge.properties.priority" type="number" min="1" max="99">
      </FormField>

      <FormField label="Condition">
        <input v-model="edge.properties.condition" placeholder="@()if(){}{}" type="text">
      </FormField>
    </template>

  </BaseForm>
</template>

<script>
import Form from '../skeletons/Form';
import BaseForm from './base';
import FormField from '../skeletons/FormField';
import { ObjectType } from '../../interfaces/ObjectType';
import { EdgeType } from '../../my-diagram/my-edge';
import { MY_EVENTS } from '../../my-diagram/my-events';
export default {
  components: {
    Form,
    BaseForm,
    FormField,
  },
  props:{
    object: {
      type: Object,
      required: true,
    }
  },
  data: () => ({
    edge: {},
  }),
  computed: {
    isStart(){
      const o = this.edge;
      return o.what == ObjectType.Edge && o.properties.type == EdgeType.START;
    },
  },
  watch: {
    object: {
      deep: false,
      immediate: true,
      handler(){
        this.edge = this.object.getInstance();
      }
    }
  },
  methods: {
    priorityInput(e){
      const prevPriority = this.edge.properties.priority;
      const value = e.target.value;
      let priority = parseInt(value || '1');
      if(priority > 99) priority = 99;
      this.edge.properties.priority = priority;

      const store = this.edge.store;
      if(prevPriority !== priority && store){
        store.emit(MY_EVENTS.EDGE_PRIORITY_CHANGED_BY_USER, {
          edge: this.edge,
          data: prevPriority
        })
      }
    }
  }
}
</script>
