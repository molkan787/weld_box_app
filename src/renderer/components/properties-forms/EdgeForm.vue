<template>
  <BaseForm :object="edge" :showNameField="!isStart" :objectType="isStart ? 'Start Edge' : 'Edge'">

    <template v-if="!isStart">
      <FormField label="Priority">
        <input v-model.number="edge.properties.priority" type="number" min="0" max="99">
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
  }
}
</script>
