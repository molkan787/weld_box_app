<template>
  <BaseForm :object="object">

    <FormField v-if="needsPriority" label="Priority">
      <input type="number" min="1" @input="priorityInput" :value="props.priority">
    </FormField>

    <FormField label="Type">
      <RadioButtonGroup :items="decompositionItems" v-model="props.decomposition" />
      <div class="checkbox">
        <input type="checkbox" v-model="props.historic" id="isHistoric">
        <label for="isHistoric">Historic</label>
      </div>
    </FormField>

  </BaseForm>
</template>

<script>
import BaseForm from './base';
import FormField from '../skeletons/FormField';
import RadioButtonGroup from '../skeletons/RadioButtonGroup';
import { StateDecomposition } from '../../my-diagram/state';
import { MY_EVENTS } from '../../my-diagram/my-events';
export default {
  components: {
    BaseForm,
    FormField,
    RadioButtonGroup,
  },
  props:{
    object: {
      type: Object,
      required: true,
    }
  },
  computed:{
    props(){
      return this.object.properties;
    },
    needsPriority(){
      const o = this.object;
      return o && o._parent && o._parent.properties.decomposition === StateDecomposition.Parallel;
    }
  },
  data: () => ({
    decompositionItems: [
      { text: 'Serial', value: 'serial' },
      { text: 'Parallel', value: 'parallel' }
    ]
  }),
  methods: {
    priorityInput(e){
      const prevPriority = this.props.priority;
      const value = e.target.value;
      let priority = parseInt(value || '1');
      this.props.priority = priority;

      const store = this.object.store;
      if(prevPriority !== priority && store){
        store.emit(MY_EVENTS.NODE_PRIORITY_CHANGED_BY_USER, {
          node: this.object,
          data: prevPriority
        })
      }
    }
  }
}
</script>
